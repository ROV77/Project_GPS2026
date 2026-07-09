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
  // MercadoPago (pago de suscripciones). Opcional: la API arranca sin ella y
  // solo /api/subscriptions/checkout exige que esté configurada (responde 503
  // si falta). Usa un access token de PRUEBA (sandbox) en desarrollo.
  MP_ACCESS_TOKEN: z.string().optional(),
  // URL pública del panel web, para las back_urls del Checkout Pro (a dónde
  // vuelve el navegador tras pagar).
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  // URL pública de ESTA API, para el notification_url del webhook de
  // MercadoPago. En local debe ser un túnel (ngrok, etc.) porque MercadoPago
  // necesita alcanzarla desde internet — localhost no sirve.
  API_PUBLIC_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env');
}

export const env = parsed.data;
