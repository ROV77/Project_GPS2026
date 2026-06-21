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
import { searchStores } from '../controllers/store.controller';
import { validateQuery, validateBody } from '../middlewares/validate';
import { calculateStoreStatus, getCurrentDayOfWeek } from '../services/store-status.service';
import {
  findSchedulesByStore,
  upsertSchedules,
  findScheduleForDay,
} from '../repositories/schedule.repository';

const fkFields = ['owner_id', 'category_id', 'region_id', 'commune_id'] as const;

const crud = makeCrud(prisma.stores, createStoreSchema, updateStoreSchema, {
  transform: (data) => {
    const out = { ...data };
    for (const field of fkFields) {
      if (out[field] !== undefined) out[field] = BigInt(out[field] as number);
    }
    return out;
  },
});

export const storesRouter = Router();

/**
 * GET /stores/search
 * Listado filtrado con rating promedio.
 * Query params: region_id, commune_id, category_id, verified_only, page, limit
 */
storesRouter.get('/search', validateQuery(StoreFiltersSchema), searchStores);

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

// ─── Montar rutas CRUD genéricas después de las rutas específicas ────────────
// (para que /search y /:id/status no colisionen con /:id)
const crudRoutes = crudRouter(crud);
storesRouter.use('/', crudRoutes);
