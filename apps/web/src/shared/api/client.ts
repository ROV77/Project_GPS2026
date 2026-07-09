import axios from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Instancia única de axios para toda la app.
 *
 * baseURL '/api' por defecto: en dev, Vite la redirige al backend
 * (http://localhost:3000) vía proxy. En producción se puede sobreescribir con
 * VITE_API_URL. Todos los módulos de feature importan ESTE cliente; nunca se
 * llama a axios.get('http://...') suelto.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el JWT de la sesión (si existe) en cada request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expira o es inválido (401), cierra la sesión y vuelve al login.
// (El login en sí también puede devolver 401 con credenciales malas, pero como
// ya estamos en /login no redirige; LoginPage muestra el error.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
