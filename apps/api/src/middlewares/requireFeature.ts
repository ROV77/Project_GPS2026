import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';
import { getStoreCapabilities, type PlanCapabilities } from '../services/plan-access.service';

/** Capacidades booleanas que se pueden exigir con requireFeature. */
type BooleanFeature = Exclude<keyof PlanCapabilities, 'maxProducts'>;

/** Mensaje 403 por capacidad denegada (lo ve el cliente). */
const DENIED_MESSAGE: Record<BooleanFeature, string> = {
  canViewStats: 'Las estadísticas están disponibles desde el plan Pro.',
  canUsePromotions: 'Las promociones están disponibles desde el plan Pro.',
  verifiedBadge: 'La verificación destacada está disponible en el plan Premium.',
  prioritySupport: 'El soporte prioritario está disponible en el plan Premium.',
};

/**
 * Middleware que exige que el plan vigente de la tienda incluya una capacidad.
 * Requiere que requireAuth + withStore hayan corrido antes (lee
 * res.locals.storeId). Responde 403 si el plan no la incluye. Es el candado
 * REAL detrás de la UI: aunque el frontend oculte el botón, esta ruta rechaza
 * igual a quien llame la API a mano.
 */
export function requireFeature(feature: BooleanFeature) {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = res.locals.storeId as bigint | null;
      if (!storeId) {
        next(new HttpError(403, 'No tienes una tienda asociada'));
        return;
      }
      const capabilities = await getStoreCapabilities(storeId);
      if (!capabilities[feature]) {
        next(new HttpError(403, DENIED_MESSAGE[feature]));
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
