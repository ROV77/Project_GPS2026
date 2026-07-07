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
  /** Teléfono de contacto de la tienda (formato libre, ej. "+56 9 ..."). Base del enlace de WhatsApp. */
  store_phone: string | null;
  /** La API devuelve Decimal como string (Prisma $queryRaw), pero puede llegar como number. */
  latitude: string | number | null;
  /** La API devuelve Decimal como string (Prisma $queryRaw), pero puede llegar como number. */
  longitude: string | number | null;
  /** Dirección completa legible (metadata.address). */
  address: string | null;
  /** Calle (metadata.street). */
  address_street: string | null;
  /** Número de casa/local (metadata.number). */
  address_number: string | null;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: string | number;
  review_count: number;
}

/**
 * Producto del catálogo de una tienda, alineado con GET /api/stores/:id/products
 * (ver apps/api/src/repositories/store.repository.ts → findPublicStoreProducts).
 * `price` llega como string (Decimal serializado) o number; se normaliza al mostrar.
 * El mobile solo lee imágenes (`image_url`), nunca las sube.
 */
/**
 * Promoción vigente de un producto, tal como la adjunta GET /api/stores/:id/products
 * (solo activas y dentro de la ventana de fechas). `discount_value` solo trae número
 * en 'percentage'; en las promos por cantidad (2x1/3x2) es null.
 */
export interface ProductPromotion {
  id: string;
  discount_type: 'percentage' | '2x1' | '3x2';
  discount_value: string | number | null;
  valid_from: string | null;
  valid_until: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
  image_url: string | null;
  featured: boolean;
  /** 0 o 1 promoción vigente (una activa por producto). */
  promotions?: ProductPromotion[];
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
