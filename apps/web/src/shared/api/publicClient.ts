import axios from 'axios';

/**
 * Cliente HTTP para endpoints públicos (sin sesión).
 * No redirige a /login en 401 — a diferencia de `api`, que asume panel autenticado.
 */
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});
