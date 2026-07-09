import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
