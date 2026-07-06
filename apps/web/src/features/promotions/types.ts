import type { Id } from '@/shared/api/types';
import type { PromotionType } from '@caserita/validations';

export type { PromotionType };

/** Producto embebido que la API adjunta a cada promoción. */
export interface PromotionProduct {
  id: Id;
  name: string;
  /** Decimal de Postgres; llega como number o string en JSON. */
  price: number | string;
  image_url?: string | null;
}

/** Promoción tal como la devuelve la API (GET /api/promotions). */
export interface Promotion {
  id: Id;
  store_id: Id;
  product_id: Id;
  discount_type: PromotionType;
  /** Solo el tipo 'percentage' trae un valor (el %); las promos por cantidad, null. */
  discount_value: number | string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  products: PromotionProduct;
}
