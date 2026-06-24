import { Router } from 'express';
import { createStoreSchema, updateStoreSchema, StoreFiltersSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';
import { searchStores, getStoreStats } from '../controllers/store.controller';
import { validateQuery } from '../middlewares/validate';

const fkFields = ['owner_id', 'category_id', 'region_id', 'commune_id'] as const;

const crud = makeCrud(prisma.stores, createStoreSchema, updateStoreSchema, {
  transform: (data) => {
    const { address, address_street, address_number, ...rest } = data;
    const out: Record<string, unknown> = { ...rest };

    for (const field of fkFields) {
      if (out[field] !== undefined) out[field] = BigInt(out[field] as number);
    }

    const locationMeta: Record<string, unknown> = {};
    if (address !== undefined) locationMeta.address = address || null;
    if (address_street !== undefined) locationMeta.street = address_street || null;
    if (address_number !== undefined) locationMeta.number = address_number || null;

    if (Object.keys(locationMeta).length > 0) {
      out.metadata = locationMeta;
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
 * GET /stores/:id/stats
 * Métricas agregadas de la tienda para el dashboard.
 */
storesRouter.get('/:id/stats', getStoreStats);

// ─── Montar rutas CRUD genéricas después de las rutas específicas ────────────
// (para que /search y /:id/stats no colisionen con /:id)
const crudRoutes = crudRouter(crud);
storesRouter.use('/', crudRoutes);
