import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const createRegionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
const updateRegionSchema = createRegionSchema.partial();

const crud = makeCrud(prisma.regions, createRegionSchema, updateRegionSchema);

export const regionsRouter = Router();

/**
 * GET /api/regions/all — todas las regiones de Chile, ordenadas
 * alfabéticamente. Solo 16 registros, ideal para cachear en el cliente.
 */
regionsRouter.get('/all', async (_req: Request, res: Response): Promise<void> => {
  const regions = await prisma.regions.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(regions);
});

/**
 * GET /api/regions/:regionId/communes — comunas de una región, ordenadas
 * alfabéticamente. Usado para el dropdown en cascada del frontend: el
 * usuario selecciona región y se cargan las comunas disponibles.
 */
regionsRouter.get('/:regionId/communes', async (req: Request, res: Response): Promise<void> => {
  const regionId = Number(req.params.regionId);

  if (!Number.isInteger(regionId) || regionId <= 0) {
    res.status(400).json({ error: 'regionId inválido' });
    return;
  }

  const communes = await prisma.communes.findMany({
    where: { region_id: BigInt(regionId) },
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  });
  res.json(communes);
});

// CRUD genérico
regionsRouter.use('/', crudRouter(crud));
