import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type {
  StoreFilters,
  PaginationParams,
  PaginatedResponse,
  StoreWithRating,
} from '@caserita/shared-types';

/**
 * Listado de tiendas con filtros por ubicación, categoría y verificación.
 * Incluye rating promedio y conteo de reviews via raw SQL (Prisma no soporta
 * AVG en select estándar sin vistas).
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
  const stores = await prisma.$queryRaw<StoreWithRating[]>`
    SELECT
      s.id,
      s.name,
      s.description,
      s.logo_url,
      s.verified,
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
    ${whereClause}
    GROUP BY s.id, r.name, c.name, c.city, cat.name
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

  return {
    data: stores,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  };
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

