import { Router } from 'express';
import { createStoreSchema, updateStoreSchema, StoreFiltersSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';
import {
  findStoresWithRating,
  findCommunesByRegion,
  findAllRegions,
} from '../repositories/store.repository';

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
storesRouter.get('/search', async (req, res, next) => {
  try {
    const parsed = StoreFiltersSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Parámetros inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { region_id, commune_id, category_id, verified_only, page, limit } =
      parsed.data;

    const result = await findStoresWithRating(
      {
        regionId: region_id,
        communeId: commune_id,
        categoryId: category_id,
        verifiedOnly: verified_only,
      },
      { page, limit },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/regions
 * Todas las regiones (para el primer dropdown del filtro).
 */
storesRouter.get('/regions', async (_req, res, next) => {
  try {
    const regions = await findAllRegions();
    res.json(regions);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /stores/regions/:regionId/communes
 * Comunas de una región (para el dropdown en cascada).
 */
storesRouter.get('/regions/:regionId/communes', async (req, res, next) => {
  try {
    const regionId = Number(req.params.regionId);

    if (!Number.isInteger(regionId) || regionId <= 0) {
      res.status(400).json({ error: 'regionId inválido' });
      return;
    }

    const communes = await findCommunesByRegion(regionId);
    res.json(communes);
  } catch (error) {
    next(error);
  }
});

// ─── Montar rutas CRUD genéricas después de las rutas específicas ────────────
// (para que /search, /regions no colisionen con /:id)
const crudRoutes = crudRouter(crud);
storesRouter.use('/', crudRoutes);
