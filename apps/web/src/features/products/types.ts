import type { Id } from '@/shared/api/types';

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
