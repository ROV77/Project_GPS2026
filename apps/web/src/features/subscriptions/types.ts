import type { Id } from '@/shared/api/types';
import type { Plan } from '../plans/types';

/**
 * Capacidades que desbloquea el plan vigente. Las calcula el backend y las
 * expone en GET /api/subscriptions/me; el frontend solo las consume para
 * condicionar la UI (nunca decide comparando el nombre del plan).
 */
export interface PlanCapabilities {
  /** Tope de productos publicables; `null` = ilimitado. */
  maxProducts: number | null;
  canViewStats: boolean;
  canUsePromotions: boolean;
  verifiedBadge: boolean;
  prioritySupport: boolean;
}

/** Suscripción vigente de la tienda (GET /api/subscriptions/me). */
export interface Subscription {
  id: Id | null;
  plan: Plan;
  state: string | null;
  starts_at: string | null;
  expires_at: string | null;
  capabilities: PlanCapabilities;
}

/** Respuesta de POST /api/subscriptions/checkout. */
export interface CheckoutResult {
  requiresPayment: boolean;
  init_point?: string;
  subscription?: Subscription;
}
