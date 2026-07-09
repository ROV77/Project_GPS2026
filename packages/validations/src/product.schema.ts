import { z } from 'zod';

export const createProductSchema = z.object({
  store_id: z.coerce.number().int().positive(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  image_url: z.string().url().optional(),
  featured: z.coerce.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
