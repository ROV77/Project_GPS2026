/** Filtros de ubicación y categoría para el listado de tiendas */
export interface StoreFilters {
  regionId?: number;
  communeId?: number;
  categoryId?: number;
  verifiedOnly?: boolean;
  q?: string;
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

// ─── Estado visual (semáforo) ────────────────────────────────────────────────

/** Los tres estados posibles del semáforo de apertura */
export type StoreVisualStatus = 'open' | 'closing_soon' | 'closed';

/** Resultado completo del cálculo de estado visual */
export interface StoreStatusResult {
  status: StoreVisualStatus;
  /** Etiqueta legible: "Abierto", "Cierra pronto", "Cerrado" */
  label: string;
  color: 'green' | 'yellow' | 'red';
  /** Minutos restantes hasta el cierre. null si cerrado o sin horario */
  minutesUntilClose: number | null;
}

// ─── Fila del listado de tiendas ─────────────────────────────────────────────

/** Fila del listado de tiendas con rating promedio (resultado del raw query) */
export interface StoreWithRating {
  id: bigint;
  name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  store_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
  /** Dirección completa legible (stores.metadata.address). */
  address: string | null;
  /** Calle (stores.metadata.street). */
  address_street: string | null;
  /** Número de casa/local (stores.metadata.number). */
  address_number: string | null;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: number;
  review_count: number;
  /** Estado visual calculado (semáforo). No se persiste en la DB. */
  status: StoreVisualStatus;
  /** Color del semáforo: 'green' | 'yellow' | 'red' */
  color: 'green' | 'yellow' | 'red';
  /** Minutos restantes hasta el cierre. null si cerrado o sin horario */
  minutesUntilClose: number | null;
}
