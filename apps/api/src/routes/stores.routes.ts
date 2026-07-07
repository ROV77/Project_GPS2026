import { Router } from 'express';
import {
  createStoreSchema,
  updateStoreSchema,
  StoreFiltersSchema,
  upsertSchedulesSchema,
  type UpsertSchedulesInput,
} from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';
import { parseBigIntId } from '../lib/http';
import {
  searchStores,
  getStoreStats,
  getStoreDetail,
  getStoreProducts,
} from '../controllers/store.controller';
import { validateQuery, validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { withStore } from '../middlewares/withStore';
import { requireFeature } from '../middlewares/requireFeature';
import { calculateStoreStatus, getCurrentDayOfWeek } from '../services/store-status.service';
import {
  findSchedulesByStore,
  upsertSchedules,
  findScheduleForDay,
} from '../repositories/schedule.repository';

const fkFields = ['owner_id', 'category_id', 'region_id', 'commune_id'] as const;

function buildStoreWriteData(data: Record<string, unknown>, existingMetadata?: unknown) {
  const { address, address_street, address_number, ...rest } = data;
  const out: Record<string, unknown> = { ...rest };

  for (const field of fkFields) {
    if (out[field] !== undefined) out[field] = BigInt(out[field] as number);
  }

  const locationPatch: Record<string, unknown> = {};
  if (address !== undefined) locationPatch.address = address || null;
  if (address_street !== undefined) locationPatch.street = address_street || null;
  if (address_number !== undefined) locationPatch.number = address_number || null;

  if (Object.keys(locationPatch).length > 0) {
    const prev =
      existingMetadata && typeof existingMetadata === 'object'
        ? (existingMetadata as Record<string, unknown>)
        : {};
    out.metadata = { ...prev, ...locationPatch };
  }

  return out;
}

const crud = makeCrud(prisma.stores, createStoreSchema, updateStoreSchema, {
  transform: (data) => buildStoreWriteData(data),
});

export const storesRouter = Router();

/**
 * GET /stores/search
 * Listado filtrado con rating promedio.
 * Query params: region_id, commune_id, category_id, verified_only, page, limit
 */
storesRouter.get('/search', validateQuery(StoreFiltersSchema), searchStores);

/**
 * GET /stores/:id/stats
 * Métricas agregadas de la tienda para el dashboard. Es una función del plan
 * Pro: requireFeature('canViewStats') rechaza con 403 a las tiendas en Gratis.
 * Necesita requireAuth + withStore para resolver el plan de la tienda del usuario.
 */
storesRouter.get(
  '/:id/stats',
  requireAuth,
  withStore,
  requireFeature('canViewStats'),
  getStoreStats,
);

/**
 * GET /stores/:id/products
 * Catálogo público de la tienda (sin auth) — usado por el detalle en mobile.
 */
storesRouter.get('/:id/products', getStoreProducts);

/**
 * GET /stores/:id/schedules
 * Devuelve los 7 horarios de la tienda (uno por día).
 */
storesRouter.get('/:id/schedules', async (req, res, next) => {
  try {
    const storeId = parseBigIntId(String(req.params.id));
    if (storeId === null) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const schedules = await findSchedulesByStore(storeId);
    const formattedSchedules = schedules.map((s) => ({
      id: s.id.toString(),
      store_id: s.store_id.toString(),
      day_of_week: s.day_of_week,
      is_closed: s.is_closed,
      opening_time: s.opening_time ? s.opening_time.toISOString().substring(11, 19) : null,
      closing_time: s.closing_time ? s.closing_time.toISOString().substring(11, 19) : null,
    }));
    res.json(formattedSchedules);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /stores/:id/schedules
 * Guarda/actualiza los 7 horarios de la tienda (en transacción).
 */
storesRouter.put(
  '/:id/schedules',
  validateBody(upsertSchedulesSchema),
  async (req, res, next) => {
    try {
      const storeId = parseBigIntId(String(req.params.id));
      if (storeId === null) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const schedulesInput = res.locals.body as UpsertSchedulesInput;
      const results = await upsertSchedules(storeId, schedulesInput);

      const formattedResults = results.map((s) => ({
        id: s.id.toString(),
        store_id: s.store_id.toString(),
        day_of_week: s.day_of_week,
        is_closed: s.is_closed,
        opening_time: s.opening_time ? s.opening_time.toISOString().substring(11, 19) : null,
        closing_time: s.closing_time ? s.closing_time.toISOString().substring(11, 19) : null,
      }));

      res.json(formattedResults);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /stores/:id/status
 * Estado visual (semáforo) de una tienda individual.
 * Devuelve: { status, label, color, minutesUntilClose }
 *
 * Útil para la app mobile cuando solo necesita refrescar el indicador
 * sin recargar toda la ficha de la tienda.
 */
storesRouter.get('/:id/status', async (req, res, next) => {
  try {
    const id = parseBigIntId(String(req.params.id));
    if (id === null) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const dayOfWeek = getCurrentDayOfWeek();
    const [store, schedule] = await Promise.all([
      prisma.stores.findFirst({
        where: { id },
        select: { opening_time: true, closing_time: true },
      }),
      findScheduleForDay(id, dayOfWeek),
    ]);

    if (!store) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

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
      openingStr = store.opening_time
        ? store.opening_time.toISOString().substring(11, 19)
        : null;
      closingStr = store.closing_time
        ? store.closing_time.toISOString().substring(11, 19)
        : null;
    }

    const status = calculateStoreStatus(openingStr, closingStr, { isClosed });

    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/:id
 * Ficha enriquecida (categoría, comuna, región, rating, estado). Debe ir DESPUÉS
 * de las rutas /:id/* específicas y ANTES del CRUD genérico, para tener prioridad
 * sobre el getById crudo (que solo devuelve la fila sin campos computados).
 */
storesRouter.get('/:id', getStoreDetail);

// ─── Montar rutas CRUD genéricas después de las rutas específicas ────────────
// (para que /search, /:id/stats, /:id/schedules y /:id/status no colisionen con /:id)

/**
 * PUT /stores/:id — actualización con merge de metadata (preserva claves existentes).
 * Registrado antes del CRUD genérico para que tenga prioridad sobre su PUT /:id.
 */
storesRouter.put('/:id', validateBody(updateStoreSchema), async (req, res, next) => {
  try {
    const id = parseBigIntId(String(req.params.id));
    if (id === null) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const data = updateStoreSchema.parse(req.body);
    const existing = await prisma.stores.findFirst({
      where: { id },
      select: { metadata: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }

    const updated = await prisma.stores.update({
      where: { id },
      data: buildStoreWriteData(data, existing.metadata),
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

const crudRoutes = crudRouter(crud);
storesRouter.use('/', crudRoutes);