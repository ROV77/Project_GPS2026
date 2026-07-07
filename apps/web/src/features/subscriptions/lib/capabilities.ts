import type { PlanCapabilities } from '../types';

/**
 * Capacidades del plan más restrictivo (Gratis). Se usa como valor por defecto
 * mientras la suscripción carga o si la consulta falla: ante la duda, no
 * mostramos funciones de pago. Debe coincidir con RESTRICTED_CAPABILITIES del
 * backend (apps/api/src/services/plan-access.service.ts).
 */
export const RESTRICTED_CAPABILITIES: PlanCapabilities = {
  maxProducts: 20,
  canViewStats: false,
  canUsePromotions: false,
  verifiedBadge: false,
  prioritySupport: false,
};
