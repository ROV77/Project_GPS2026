import type { Id, PageParams } from '@/shared/api/types';

/** Orden soportado por el backend (GET /api/products?sort=). */
export type ProductSort =
  | 'id_asc'
  | 'stock_asc'
  | 'stock_desc'
  | 'price_asc'
  | 'price_desc';

/** Parámetros del listado de productos: paginación + filtros del backend. */
export interface ProductListParams extends PageParams {
  search?: string;
  featured?: boolean;
  lowStock?: boolean;
  sort?: ProductSort;
}

/** Umbral de "stock bajo" (coincide con LOW_STOCK_THRESHOLD del backend). */
export const LOW_STOCK_THRESHOLD = 5;

/** Producto tal como lo devuelve la API (GET /api/products). */
export interface Product {
  id: Id;
  store_id: Id;
  name: string;
  description?: string | null;
  /** Decimal de Postgres; llega como number o string en JSON. formatCLP lo normaliza. */
  price: number | string;
  stock: number;
  image_url?: string | null;
  featured: boolean;
  updated_at?: string | null;
  deleted_at?: string | null;
}
