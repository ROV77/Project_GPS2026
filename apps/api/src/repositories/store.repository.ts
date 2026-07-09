import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { calculateStoreStatus, getCurrentDayOfWeek } from '../services/store-status.service';
import { findVerifiedByPlanStoreIds } from '../services/plan-access.service';
import { findTodaySchedulesForStores } from './schedule.repository';
import type {
  StoreFilters,
  PaginationParams,
  PaginatedResponse,
  StoreWithRating,
} from '../types/store.types';

// ─── Tipo interno para las filas del raw query (sin campos computados) ───────

interface StoreRawRow {
  id: bigint;
  name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  store_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  address: string | null;
  address_street: string | null;
  address_number: string | null;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: number;
  review_count: number;
}

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * Listado de tiendas con filtros por ubicación, categoría y verificación.
 * Incluye rating promedio y conteo de reviews via raw SQL (Prisma no soporta
 * AVG en select estándar sin vistas).
 *
 * Cada tienda devuelta incluye el estado visual calculado (semáforo):
 *   🟢 open          → dentro del horario, >30 min para cerrar
 *   🟡 closing_soon  → dentro del horario, ≤30 min para cerrar
 *   🔴 closed        → fuera del horario o sin horario configurado
 *
 * Los filtros se construyen dinámicamente, solo se incluyen las condiciones
 * para parámetros que realmente llegan en el request.
 *
 * Seguridad: usa Prisma.sql + Prisma.join para construir el WHERE,
 * lo que previene SQL injection sin concatenar strings.
 */
export async function findStoresWithRating(
  filters: StoreFilters,
  pagination: PaginationParams,
): Promise<PaginatedResponse<StoreWithRating>> {
  const { regionId, communeId, categoryId, verifiedOnly = false } = filters;
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  // Construir condiciones dinámicamente (solo lo que llega)
  const conditions: Prisma.Sql[] = [];
  if (regionId) conditions.push(Prisma.sql`s.region_id = ${BigInt(regionId)}`);
  if (communeId) conditions.push(Prisma.sql`s.commune_id = ${BigInt(communeId)}`);
  if (categoryId) conditions.push(Prisma.sql`s.category_id = ${BigInt(categoryId)}`);
  if (verifiedOnly) conditions.push(Prisma.sql`s.verified = true`);

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

  // Query principal: datos + rating promedio en un solo viaje a la db
  const rawStores = await prisma.$queryRaw<StoreRawRow[]>`
    SELECT
      s.id,
      s.name,
      s.description,
      s.logo_url,
      s.verified,
      s.store_phone,
      s.latitude,
      s.longitude,
      s.opening_time,
      s.closing_time,
      s.metadata->>'address' AS address,
      s.metadata->>'street' AS address_street,
      s.metadata->>'number' AS address_number,
      r.name  AS region_name,
      c.name  AS commune_name,
      c.city  AS commune_city,
      cat.name AS category_name,
      COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
      COUNT(rv.id)::INT                               AS review_count
    FROM   stores s
    LEFT JOIN regions    r   ON r.id   = s.region_id
    LEFT JOIN communes   c   ON c.id   = s.commune_id
    LEFT JOIN categories cat ON cat.id = s.category_id
    LEFT JOIN reviews    rv  ON rv.store_id = s.id
    ${whereClause}
    GROUP BY s.id, s.metadata, r.name, c.name, c.city, cat.name
    ORDER BY s.id
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  // Count total para paginación
  const [{ total }] = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COUNT(*) AS total
    FROM   stores s
    ${whereClause}
  `;

  // Enriquecer cada tienda con el estado visual (semáforo)
  const dayOfWeek = getCurrentDayOfWeek();
  const storeIds = rawStores.map((s) => s.id);
  const [schedules, verifiedByPlan] = await Promise.all([
    findTodaySchedulesForStores(storeIds, dayOfWeek),
    findVerifiedByPlanStoreIds(storeIds),
  ]);

  // Mapear por store_id para búsqueda rápida O(1)
  const schedulesMap = new Map(
    schedules.map((s) => [s.store_id.toString(), s])
  );

  const stores: StoreWithRating[] = rawStores.map((store) => {
    const schedule = schedulesMap.get(store.id.toString());
    
    let openingStr: string | null = null;
    let closingStr: string | null = null;
    let isClosed = false;

    if (schedule) {
      isClosed = schedule.is_closed;
      openingStr = schedule.opening_time
        ? schedule.opening_time.toISOString().substring(11, 19)
        : null;
      closingStr = schedule.closing_time
        ? schedule.closing_time.toISOString().substring(11, 19)
        : null;
    } else {
      // Fallback a los campos de la tabla stores
      openingStr = store.opening_time;
      closingStr = store.closing_time;
      isClosed = false;
    }

    const statusResult = calculateStoreStatus(openingStr, closingStr, { isClosed });
    return {
      ...store,
      // Verificado efectivo: manual (columna) O por plan Premium vigente.
      verified: store.verified || verifiedByPlan.has(store.id.toString()),
      status: statusResult.status,
      color: statusResult.color,
      minutesUntilClose: statusResult.minutesUntilClose,
    };
  });

  return {
    data: stores,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  };
}

/**
 * Detalle de una tienda individual con el mismo shape enriquecido que el
 * listado (`findStoresWithRating`): rating promedio, nombres de categoría/
 * comuna/región y estado visual (semáforo). Reutiliza el mismo SELECT + JOINs,
 * acotado por `WHERE s.id = ${id}` y sin paginación.
 *
 * Devuelve `null` si la tienda no existe (para que el controlador responda 404).
 */
export async function findStoreByIdWithRating(
  id: bigint,
): Promise<StoreWithRating | null> {
  const rawStores = await prisma.$queryRaw<StoreRawRow[]>`
    SELECT
      s.id,
      s.name,
      s.description,
      s.logo_url,
      s.verified,
      s.store_phone,
      s.latitude,
      s.longitude,
      s.opening_time,
      s.closing_time,
      r.name  AS region_name,
      c.name  AS commune_name,
      c.city  AS commune_city,
      cat.name AS category_name,
      COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
      COUNT(rv.id)::INT                               AS review_count
    FROM   stores s
    LEFT JOIN regions    r   ON r.id   = s.region_id
    LEFT JOIN communes   c   ON c.id   = s.commune_id
    LEFT JOIN categories cat ON cat.id = s.category_id
    LEFT JOIN reviews    rv  ON rv.store_id = s.id
    WHERE  s.id = ${id}
    GROUP BY s.id, r.name, c.name, c.city, cat.name
  `;

  const store = rawStores[0];
  if (!store) return null;

  // Enriquecer con el estado visual (semáforo) del día actual + verificado por plan.
  const dayOfWeek = getCurrentDayOfWeek();
  const [schedules, verifiedByPlan] = await Promise.all([
    findTodaySchedulesForStores([store.id], dayOfWeek),
    findVerifiedByPlanStoreIds([store.id]),
  ]);
  const schedule = schedules[0];

  let openingStr: string | null = null;
  let closingStr: string | null = null;
  let isClosed = false;

  if (schedule) {
    isClosed = schedule.is_closed;
    openingStr = schedule.opening_time
      ? schedule.opening_time.toISOString().substring(11, 19)
      : null;
    closingStr = schedule.closing_time
      ? schedule.closing_time.toISOString().substring(11, 19)
      : null;
  } else {
    // Fallback a los campos de la tabla stores
    openingStr = store.opening_time;
    closingStr = store.closing_time;
  }

  const statusResult = calculateStoreStatus(openingStr, closingStr, { isClosed });
  return {
    ...store,
    // Verificado efectivo: manual (columna) O por plan Premium vigente.
    verified: store.verified || verifiedByPlan.has(store.id.toString()),
    status: statusResult.status,
    color: statusResult.color,
    minutesUntilClose: statusResult.minutesUntilClose,
  };
}

/**
 * Tiendas con el mismo shape enriquecido que el listado/detalle, acotadas a un
 * conjunto de IDs (usado por el listado de favoritos). Reutiliza el mismo SELECT
 * + JOINs y el enriquecido de semáforo. Devuelve las tiendas en el MISMO orden en
 * que llegan los IDs (el llamador ya los ordena por "más recién marcado").
 *
 * Si `ids` viene vacío, devuelve `[]` sin tocar la db.
 */
export async function findStoresByIdsWithRating(
  ids: bigint[],
): Promise<StoreWithRating[]> {
  if (ids.length === 0) return [];

  const rawStores = await prisma.$queryRaw<StoreRawRow[]>`
    SELECT
      s.id,
      s.name,
      s.description,
      s.logo_url,
      s.verified,
      s.store_phone,
      s.latitude,
      s.longitude,
      s.opening_time,
      s.closing_time,
      s.metadata->>'address' AS address,
      s.metadata->>'street' AS address_street,
      s.metadata->>'number' AS address_number,
      r.name  AS region_name,
      c.name  AS commune_name,
      c.city  AS commune_city,
      cat.name AS category_name,
      COALESCE(ROUND(AVG(rv.rating)::NUMERIC, 1), 0) AS avg_rating,
      COUNT(rv.id)::INT                               AS review_count
    FROM   stores s
    LEFT JOIN regions    r   ON r.id   = s.region_id
    LEFT JOIN communes   c   ON c.id   = s.commune_id
    LEFT JOIN categories cat ON cat.id = s.category_id
    LEFT JOIN reviews    rv  ON rv.store_id = s.id
    WHERE  s.id IN (${Prisma.join(ids)})
    GROUP BY s.id, s.metadata, r.name, c.name, c.city, cat.name
  `;

  const dayOfWeek = getCurrentDayOfWeek();
  const storeIds = rawStores.map((s) => s.id);
  const [schedules, verifiedByPlan] = await Promise.all([
    findTodaySchedulesForStores(storeIds, dayOfWeek),
    findVerifiedByPlanStoreIds(storeIds),
  ]);
  const schedulesMap = new Map(schedules.map((s) => [s.store_id.toString(), s]));

  const enriched = rawStores.map((store) => {
    const schedule = schedulesMap.get(store.id.toString());

    let openingStr: string | null = null;
    let closingStr: string | null = null;
    let isClosed = false;

    if (schedule) {
      isClosed = schedule.is_closed;
      openingStr = schedule.opening_time
        ? schedule.opening_time.toISOString().substring(11, 19)
        : null;
      closingStr = schedule.closing_time
        ? schedule.closing_time.toISOString().substring(11, 19)
        : null;
    } else {
      openingStr = store.opening_time;
      closingStr = store.closing_time;
    }

    const statusResult = calculateStoreStatus(openingStr, closingStr, { isClosed });
    return {
      ...store,
      verified: store.verified || verifiedByPlan.has(store.id.toString()),
      status: statusResult.status,
      color: statusResult.color,
      minutesUntilClose: statusResult.minutesUntilClose,
    };
  });

  // Reordenar según el orden de `ids` (favoritos más recientes primero).
  const byId = new Map(enriched.map((s) => [s.id.toString(), s]));
  return ids
    .map((id) => byId.get(id.toString()))
    .filter((s): s is StoreWithRating => s !== undefined);
}

/**
 * Métricas agregadas de una tienda para el dashboard:
 * conteo de productos activos, stock total, número de reseñas y rating promedio.
 */
export async function findStoreStats(storeId: bigint) {
  const [productAgg, reviewAgg] = await Promise.all([
    prisma.products.aggregate({
      where: { store_id: storeId, deleted_at: null },
      _count: { _all: true },
      _sum: { stock: true },
    }),
    prisma.reviews.aggregate({
      where: { store_id: storeId },
      _count: { _all: true },
      _avg: { rating: true },
    }),
  ]);

  return {
    product_count: productAgg._count._all,
    total_stock: productAgg._sum.stock ?? 0,
    review_count: reviewAgg._count._all,
    avg_rating: reviewAgg._avg.rating
      ? Math.round(reviewAgg._avg.rating * 10) / 10
      : 0,
  };
}

/**
 * Catálogo público de una tienda: sus productos no eliminados, con los destacados
 * primero. Solo expone campos de lectura para el cliente (mobile) — nunca
 * `deleted_at`/`updated_at`. Los BigInt y Decimal se serializan a string vía el
 * parche global de app.ts al hacer res.json.
 */
export async function findPublicStoreProducts(storeId: bigint) {
  const now = new Date();
  return prisma.products.findMany({
    where: { store_id: storeId, deleted_at: null },
    orderBy: [{ featured: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      image_url: true,
      featured: true,
      // Promoción vigente del producto (activa y dentro de la ventana de fechas).
      // Como solo puede haber una activa por producto, tomamos la primera.
      promotions: {
        where: {
          is_active: true,
          AND: [
            { OR: [{ valid_from: { equals: null } }, { valid_from: { lte: now } }] },
            { OR: [{ valid_until: { equals: null } }, { valid_until: { gte: now } }] },
          ],
        },
        select: {
          id: true,
          discount_type: true,
          discount_value: true,
          valid_from: true,
          valid_until: true,
        },
        take: 1,
      },
    },
  });
}

