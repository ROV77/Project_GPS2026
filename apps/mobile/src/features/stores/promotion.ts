/**
 * Helpers de presentación de promociones para el mobile (espejo de la lógica del
 * panel web). El descuento se muestra como TEXTO; solo 'percentage' cambia el
 * precio, las promos por cantidad (2x1/3x2) son una etiqueta.
 */
import type { Product, ProductPromotion } from './types';

/** Promoción vigente del producto (0 o 1), o null si no tiene. */
export function activePromotion(product: Product): ProductPromotion | null {
  return product.promotions?.[0] ?? null;
}

/** Etiqueta corta para el badge: "20% dcto", "2x1" o "3x2". */
export function promotionBadge(promo: ProductPromotion): string {
  if (promo.discount_type === 'percentage') return `${Number(promo.discount_value)}% dcto`;
  return promo.discount_type;
}

/** Precio con descuento (solo 'percentage'); null en promos por cantidad. */
export function discountedPrice(
  price: string | number,
  promo: ProductPromotion,
): number | null {
  if (promo.discount_type !== 'percentage' || promo.discount_value == null) return null;
  return Math.round(Number(price) * (1 - Number(promo.discount_value) / 100));
}
