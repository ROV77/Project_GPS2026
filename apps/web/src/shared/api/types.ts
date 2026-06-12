/**
 * Tipos transversales que reflejan los contratos de la API CaseritApp.
 */

/** Forma de toda respuesta de listado del backend (ver apps/api/src/lib/crud.ts). */
export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

/** Parámetros de paginación de los listados (?page=&limit=), compartidos por las api/*. */
export interface PageParams {
  page: number;
  limit: number;
}

/** Cuerpo de error que devuelve la API (ver middlewares/errorHandler.ts). */
export interface ApiErrorBody {
  error: string;
  /** Presente en 400 de validación zod: { campo: ["mensaje", ...] }. */
  issues?: Record<string, string[]>;
}

/**
 * Los IDs son BIGINT serializados como string en JSON. Se modelan como string
 * en todo el front; nunca se hace parseInt sobre ellos.
 */
export type Id = string;
