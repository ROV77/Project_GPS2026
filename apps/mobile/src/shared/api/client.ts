/**
 * Instancia única de axios para toda la app mobile.
 *
 * Gemelo del cliente del panel web (apps/web/src/shared/api/client.ts):
 *  - un interceptor de REQUEST adjunta el JWT como `Authorization: Bearer`,
 *  - un interceptor de RESPONSE limpia la sesión ante un 401.
 *
 * La ÚNICA diferencia con el web es de dónde sale el token: aquí de
 * expo-secure-store (async), no de localStorage. Ver docs/AUTH-WEB-VS-MOBILE.md.
 *
 * baseURL termina en `/api` porque todas las rutas del backend cuelgan de ahí
 * (ver apps/api/src/app.ts).
 */
import axios from 'axios';
import { env } from '@/shared/config/env';
import { getToken, deleteToken } from '@/shared/lib/secureToken';

export const api = axios.create({
  baseURL: `${env.apiUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Adjunta el JWT (si hay sesión) en cada request.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante 401 (token vencido/inválido) se borra el token y se limpia el perfil en
// memoria. El store se carga con import dinámico para romper el ciclo de imports
// (client → features/auth/api → session.store → client). La navegación a login
// la deciden las pantallas que leen el estado de sesión.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteToken();
      const { useSession } = await import('@/features/auth/session.store');
      await useSession.getState().logout();
    }
    return Promise.reject(error);
  },
);
