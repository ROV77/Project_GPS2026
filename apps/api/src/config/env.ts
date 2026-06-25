import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // Secreto para firmar/verificar JWT. El default es solo para desarrollo
  // local; en producción DEBE definirse uno fuerte en el entorno.
  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Cloudinary (subida de imágenes). Opcionales: la API arranca sin ellas y solo
  // la ruta de subida exige que estén configuradas (responde 503 si faltan).
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env');
}

export const env = parsed.data;
