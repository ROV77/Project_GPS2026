import type { plans } from '@prisma/client';
import { prisma } from '../config/prisma';
import { HttpError } from '../lib/httpError';
import { subscriptionsService } from './subscriptions.service';

/**
 * Capacidades que desbloquea un plan. Es la ÚNICA fuente de verdad de "qué
 * permite cada plan": todo el gating (backend, y vía la API también el
 * frontend) las consulta desde acá, en vez de comparar contra el nombre del
 * plan disperso por el código.
 *
 * - `maxProducts`: tope de productos publicables; `null` = ilimitado.
 * - el resto son permisos booleanos por capacidad.
 */
export interface PlanCapabilities {
  maxProducts: number | null;
  canViewStats: boolean;
  canUsePromotions: boolean;
  verifiedBadge: boolean;
  prioritySupport: boolean;
}

/** Set más restrictivo (equivale al plan Gratis). Se usa como valor por defecto. */
export const RESTRICTED_CAPABILITIES: PlanCapabilities = {
  maxProducts: 20,
  canViewStats: false,
  canUsePromotions: false,
  verifiedBadge: false,
  prioritySupport: false,
};

type BooleanFlags = Omit<PlanCapabilities, 'maxProducts'>;

/**
 * Permisos booleanos por nombre de plan. Se centraliza acá a propósito: aunque
 * hoy mapea por `plan.name`, el acoplamiento vive en UN solo lugar. Si mañana se
 * quiere que el dato viva en la base, basta reemplazar este mapa por columnas
 * del plan sin tocar a los consumidores (middleware, controllers, frontend).
 */
const FLAGS_BY_PLAN: Record<string, BooleanFlags> = {
  Gratis: { canViewStats: false, canUsePromotions: false, verifiedBadge: false, prioritySupport: false },
  Pro: { canViewStats: true, canUsePromotions: true, verifiedBadge: false, prioritySupport: false },
  Premium: { canViewStats: true, canUsePromotions: true, verifiedBadge: true, prioritySupport: true },
};

/**
 * Capacidades de un plan concreto. Función pura (sin acceso a la base). Un plan
 * ausente o de nombre desconocido cae al set más restrictivo, para no
 * desbloquear de más ante datos inesperados.
 */
export function getPlanCapabilities(
  plan: Pick<plans, 'name' | 'max_products'> | null,
): PlanCapabilities {
  if (!plan) return RESTRICTED_CAPABILITIES;
  const flags = FLAGS_BY_PLAN[plan.name] ?? FLAGS_BY_PLAN.Gratis;
  return { maxProducts: plan.max_products ?? null, ...flags };
}

/** Capacidades del plan vigente de una tienda (Gratis implícito si no tiene). */
export async function getStoreCapabilities(storeId: bigint): Promise<PlanCapabilities> {
  const { plan } = await subscriptionsService.getCurrentSubscription(storeId);
  return getPlanCapabilities(plan);
}

/**
 * Candado del límite de productos: se llama ANTES de crear un producto. Si el
 * plan es ilimitado no hace nada; si no, cuenta los productos vivos de la tienda
 * y rechaza con 403 al alcanzar el tope. No borra nada retroactivamente: una
 * tienda que bajó de plan y quedó sobre el límite simplemente no puede crear
 * más hasta bajar por su cuenta.
 */
export async function assertCanAddProduct(storeId: bigint): Promise<void> {
  const { maxProducts } = await getStoreCapabilities(storeId);
  if (maxProducts === null) return; // ilimitado

  const count = await prisma.products.count({
    where: { store_id: storeId, deleted_at: null },
  });
  if (count >= maxProducts) {
    throw new HttpError(
      403,
      `Tu plan permite hasta ${maxProducts} productos. Mejora a Pro para publicar sin límite.`,
    );
  }
}

/**
 * De un conjunto de tiendas, cuáles muestran el badge de "verificado" POR SU
 * PLAN vigente (capacidad `verifiedBadge` = Premium). Se combina con la columna
 * `stores.verified` (verificación manual) al leer. Es "compute, don't store": el
 * badge no se persiste, se calcula según el plan activo y vigente.
 */
export async function findVerifiedByPlanStoreIds(storeIds: bigint[]): Promise<Set<string>> {
  if (storeIds.length === 0) return new Set();

  // Planes que otorgan el badge, derivados de la misma fuente única de verdad.
  const [plans, activeState] = await Promise.all([
    prisma.plans.findMany({ select: { id: true, name: true, max_products: true } }),
    prisma.subscriptions_states.findFirst({ where: { name: 'active' }, select: { id: true } }),
  ]);
  const badgePlanIds = plans.filter((p) => getPlanCapabilities(p).verifiedBadge).map((p) => p.id);
  if (!activeState || badgePlanIds.length === 0) return new Set();

  const now = new Date();
  const rows = await prisma.subscriptions.findMany({
    where: {
      store_id: { in: storeIds },
      plan_id: { in: badgePlanIds },
      state_id: activeState.id,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    },
    select: { store_id: true },
  });
  return new Set(rows.map((r) => r.store_id.toString()));
}
