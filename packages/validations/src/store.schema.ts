import { z } from 'zod';

/**
 * Validador de hora en formato "HH:mm" o "HH:mm:ss".
 * PostgreSQL almacena el campo como TIME, que acepta ambos formatos.
 */
const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Debe tener formato HH:mm o HH:mm:ss')
  .nullable()
  .optional();

export const createStoreSchema = z.object({
  owner_id: z.coerce.number().int().positive(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  region_id: z.coerce.number().int().positive().optional(),
  commune_id: z.coerce.number().int().positive().optional(),
  logo_url: z.string().url().optional(),
  store_phone: z.string().max(20).optional(),
  opening_time: timeField,
  closing_time: timeField,
});

export const updateStoreSchema = createStoreSchema.partial();

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

