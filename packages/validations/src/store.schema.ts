import { z } from 'zod';

const storeLocationFields = {
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitud inválida' })
    .min(-90, 'Latitud inválida')
    .max(90, 'Latitud inválida')
    .optional(),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitud inválida' })
    .min(-180, 'Longitud inválida')
    .max(180, 'Longitud inválida')
    .optional(),
  address: z.string().max(500).optional(),
  address_street: z.string().max(200).optional(),
  address_number: z.string().max(20).optional(),
};

export const createStoreSchema = z.object({
  owner_id: z.coerce.number().int().positive(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  region_id: z.coerce.number().int().positive().optional(),
  commune_id: z.coerce.number().int().positive().optional(),
  // Opcional y acepta string vacío (el form envía '' cuando no hay URL).
  logo_url: z.union([z.string().url(), z.literal('')]).optional(),
  store_phone: z.string().max(20).optional(),
  ...storeLocationFields,
});

export const updateStoreSchema = createStoreSchema.partial();

/**
 * Schema del formulario "Mi Tienda" (perfil del comercio). A diferencia de
 * updateStoreSchema (parcial, para el endpoint genérico), aquí los datos del
 * perfil son OBLIGATORIOS porque el cliente los verá en la app mobile. El logo
 * es opcional y acepta string vacío (el form envía '' cuando no hay URL).
 *
 * La comuna del select es la fuente de verdad; el mapa aporta lat/lng y la
 * dirección legible (calle + número). Las coordenadas son obligatorias.
 */
export const storeProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  category_id: z.coerce
    .number({ invalid_type_error: 'La categoría es obligatoria' })
    .int()
    .positive('La categoría es obligatoria'),
  region_id: z.coerce
    .number({ invalid_type_error: 'La región es obligatoria' })
    .int()
    .positive('La región es obligatoria'),
  commune_id: z.coerce
    .number({ invalid_type_error: 'La comuna es obligatoria' })
    .int()
    .positive('La comuna es obligatoria'),
  store_phone: z.string().min(1, 'El teléfono es obligatorio').max(20),
  logo_url: z.union([z.string().url('URL inválida'), z.literal('')]).optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Debes ubicar tu tienda en el mapa' })
    .min(-90, 'Latitud inválida')
    .max(90, 'Latitud inválida'),
  longitude: z.coerce
    .number({ invalid_type_error: 'Debes ubicar tu tienda en el mapa' })
    .min(-180, 'Longitud inválida')
    .max(180, 'Longitud inválida'),
  address: z.string().max(500).optional(),
  address_street: z.string().max(200).optional(),
  address_number: z.string().max(20).optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type StoreProfileInput = z.infer<typeof storeProfileSchema>;
