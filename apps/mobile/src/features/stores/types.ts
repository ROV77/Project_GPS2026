/**
 * Tipos del dominio "tiendas", alineados con lo que devuelve la API:
 *  - GET /api/stores/search → { data: Store[], total, page, limit, totalPages }
 *    (ver apps/api/src/repositories/store.repository.ts → StoreWithRating).
 *
 * Recordatorio: la API serializa los BigInt como STRING (parcheo en
 * apps/api/src/app.ts), por eso los `id` son `string`. `avg_rating` llega como
 * string (NUMERIC) o number según el driver; se normaliza al mostrar.
 */
export interface Store {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: string | number;
  review_count: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Filtros de GET /api/stores/search. Se tipan como number/boolean (no string) a
 * propósito: axios los serializa a query string (`?limit=50&verified_only=true`)
 * y el backend los re-parsea con Zod (`StoreFiltersSchema` en @caserita/validations,
 * que modela el formato de cable: todo string/enum). NO reemplazar por
 * `StoreFiltersInput`: ese tipo describe el wire, este la ergonomía del cliente.
 */
export interface StoreSearchParams {
  region_id?: number;
  commune_id?: number;
  category_id?: number;
  verified_only?: boolean;
  page?: number;
  limit?: number;
}
