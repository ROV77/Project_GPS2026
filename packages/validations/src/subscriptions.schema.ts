import { z } from 'zod';

/** Body de POST /api/subscriptions/checkout: qué plan quiere contratar la tienda. */
export const checkoutSchema = z.object({
  plan_id: z.string().min(1, 'El plan es obligatorio'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Body de POST /api/subscriptions/confirm: id del pago que MercadoPago adjunta
 * en la URL de retorno del checkout. Sirve para reconciliar el pago en el acto
 * sin depender de que llegue el webhook.
 */
export const confirmSchema = z.object({
  payment_id: z.string().min(1, 'Falta el id del pago'),
});

export type ConfirmInput = z.infer<typeof confirmSchema>;
