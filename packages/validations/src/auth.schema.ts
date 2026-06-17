import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Registro de un dueño de negocio: crea la cuenta (users) + su tienda (stores).
export const registerSchema = z.object({
  name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  storeName: z.string().min(2, 'Ingresa el nombre de tu negocio'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
