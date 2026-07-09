import { z } from 'zod';

/**
 * Body de POST /api/favorites: la tienda que el usuario marca como favorita.
 * El id llega como string (los BigInt viajan como string en toda la API).
 */
export const addFavoriteSchema = z.object({
  store_id: z.union([z.string(), z.number()]).transform((v) => String(v)),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
