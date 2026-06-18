import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registro de un dueño de negocio: crea la cuenta (users) + su tienda (stores).
// Ubicación y categoría son obligatorias para que la tienda no quede en null;
// teléfono y descripción son opcionales (se completan luego en "Mi Tienda").
export const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  storeName: z.string().min(2, 'Ingresa el nombre de tu negocio'),
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
  description: z.string().optional(),
  store_phone: z.string().max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Registro de un repartidor: solo crea la cuenta (users) y le asigna rol delivery.
export const registerCourierSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegisterCourierInput = z.infer<typeof registerCourierSchema>;
