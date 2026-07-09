/**
 * Configuración de entorno del cliente mobile.
 *
 * Expo expone al bundle solo las variables con prefijo `EXPO_PUBLIC_`.
 * `EXPO_PUBLIC_API_URL` apunta a la API; en un teléfono físico debe ser la IP
 * LAN del PC (no `localhost`). Ver apps/mobile/.env.example.
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://146.83.194.168:8085",
} as const;
