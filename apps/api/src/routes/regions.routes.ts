import { z } from 'zod';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const createRegionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});
const updateRegionSchema = createRegionSchema.partial();

const crud = makeCrud(prisma.regions, createRegionSchema, updateRegionSchema);

export const regionsRouter = crudRouter(crud);
