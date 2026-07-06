import { formatCLP } from '@/shared/lib/format';
import type { PromotionType } from '@caserita/validations';
import type { Promotion } from '../types';

/** Nombre legible del tipo de promoción (para selects y encabezados). */
export function promotionTypeLabel(type: PromotionType): string {
  switch (type) {
    case 'percentage':
      return 'Descuento (%)';
    case '2x1':
      return '2x1';
    case '3x2':
      return '3x2';
  }
}

/** Etiqueta corta para el badge: "20% dcto", "2x1" o "3x2". */
export function promotionBadge(
  p: Pick<Promotion, 'discount_type' | 'discount_value'>,
): string {
  if (p.discount_type === 'percentage') return `${Number(p.discount_value)}% dcto`;
  return p.discount_type;
}

/**
 * Precio con descuento como texto (solo aplica a 'percentage'). Devuelve el
 * original y el final ya formateados en CLP; `null` para promos por cantidad
 * (2x1/3x2), que no cambian el precio unitario.
 */
export function discountedPriceText(
  originalPrice: number | string,
  p: Pick<Promotion, 'discount_type' | 'discount_value'>,
): { original: string; final: string } | null {
  if (p.discount_type !== 'percentage' || p.discount_value == null) return null;
  const original = Number(originalPrice);
  const final = Math.round(original * (1 - Number(p.discount_value) / 100));
  return { original: formatCLP(original), final: formatCLP(final) };
}
