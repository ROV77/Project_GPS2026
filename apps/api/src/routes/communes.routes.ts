import { z } from 'zod';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const createCommuneSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  region_id: z.coerce.number().int().positive().optional(),
  city: z.string().optional(),
});
const updateCommuneSchema = createCommuneSchema.partial();

const crud = makeCrud(prisma.communes, createCommuneSchema, updateCommuneSchema, {
  transform: (data) => ({
    ...data,
    ...(data.region_id !== undefined
      ? { region_id: BigInt(data.region_id as number) }
      : {}),
  }),
});

export const communesRouter = crudRouter(crud);
