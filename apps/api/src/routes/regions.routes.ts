import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';
import { getRegions, getCommunesByRegion } from '../controllers/region.controller';

const createRegionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
const updateRegionSchema = createRegionSchema.partial();

const crud = makeCrud(prisma.regions, createRegionSchema, updateRegionSchema);

export const regionsRouter = Router();

// Endpoints específicos para selects en cascada
regionsRouter.get('/all', getRegions);
regionsRouter.get('/:regionId/communes', getCommunesByRegion);

// CRUD genérico
regionsRouter.use('/', crudRouter(crud));
