import type { Id } from '@/shared/api/types';
import type { Plan } from '../plans/types';

/** Suscripción vigente de la tienda (GET /api/subscriptions/me). */
export interface Subscription {
  id: Id | null;
  plan: Plan;
  state: string | null;
  starts_at: string | null;
  expires_at: string | null;
}

/** Respuesta de POST /api/subscriptions/checkout. */
export interface CheckoutResult {
  requiresPayment: boolean;
  init_point?: string;
  subscription?: Subscription;
}
