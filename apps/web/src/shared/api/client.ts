import axios from 'axios';

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
