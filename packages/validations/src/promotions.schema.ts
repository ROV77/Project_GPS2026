import { z } from 'zod';

/**
 * Tipos de promoción:
 *  - 'percentage' → descuento porcentual; requiere `discount_value` (1..100).
 *  - '2x1' / '3x2' → promo por cantidad; sin valor numérico.
 */
export const PROMOTION_TYPES = ['percentage', '2x1', '3x2'] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

// Base sin validaciones cruzadas, para poder derivar el schema de edición con
// .partial() (un ZodEffects/.superRefine no expone .partial()).
const promotionBase = z.object({
  product_id: z.coerce.number().int().positive(),
  discount_type: z.enum(PROMOTION_TYPES),
  discount_value: z.coerce.number().int().min(1).max(100).optional(),
  is_active: z.coerce.boolean().optional(),
  valid_from: z.coerce.date().optional(),
  valid_until: z.coerce.date().optional(),
});

/** El % es obligatorio para 'percentage' y el término no puede ser anterior al inicio. */
function crossChecks(d: Partial<z.infer<typeof promotionBase>>, ctx: z.RefinementCtx) {
  if (d.discount_type === 'percentage' && d.discount_value == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['discount_value'],
      message: 'El descuento (%) es obligatorio para el tipo porcentaje',
    });
  }
  if (d.valid_from && d.valid_until && d.valid_until < d.valid_from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['valid_until'],
      message: 'La fecha de término no puede ser anterior a la de inicio',
    });
  }
}

export const createPromotionSchema = promotionBase.superRefine(crossChecks);
export const updatePromotionSchema = promotionBase.partial().superRefine(crossChecks);

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
