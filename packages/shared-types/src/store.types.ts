/** Filtros de ubicación y categoría para el listado de tiendas */
export interface StoreFilters {
  regionId?: number;
  communeId?: number;
  categoryId?: number;
  verifiedOnly?: boolean;
}

/** Parámetros de paginación estándar */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Fila del listado de tiendas con rating promedio (resultado del raw query) */
export interface StoreWithRating {
  id: bigint;
  name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: number;
  review_count: number;
}
