import { z } from 'zod';

export const createStoreSchema = z.object({
  owner_id: z.coerce.number().int().positive(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  region_id: z.coerce.number().int().positive().optional(),
  commune_id: z.coerce.number().int().positive().optional(),
  logo_url: z.string().url().optional(),
  store_phone: z.string().max(20).optional(),
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
