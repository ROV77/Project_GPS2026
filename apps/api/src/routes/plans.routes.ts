import { z } from 'zod';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const createPlanSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  price: z.coerce.number().nonnegative().default(0),
  billing_period: z.string().default('monthly'),
  description: z.string().optional(),
  max_products: z.coerce.number().int().nonnegative().optional(),
  is_active: z.coerce.boolean().optional(),
});
const updatePlanSchema = createPlanSchema.partial();

const crud = makeCrud(prisma.plans, createPlanSchema, updatePlanSchema);

export const plansRouter = crudRouter(crud);
