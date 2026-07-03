import { z } from 'zod';

/** Body de POST /api/subscriptions/checkout: qué plan quiere contratar la tienda. */
export const checkoutSchema = z.object({
  plan_id: z.string().min(1, 'El plan es obligatorio'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
