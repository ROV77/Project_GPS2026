import { prisma } from '../config/prisma';
import { HttpError } from '../lib/httpError';
import { addBillingPeriod } from '../lib/billingPeriod';
import { createCheckoutPreference, getPayment } from '../config/mercadopago';

type SubscriptionRow = Awaited<ReturnType<typeof prisma.subscriptions.findFirst<{
  include: { plans: true; subscriptions_states: true };
}>>>;

async function getSubscriptionStateId(name: string): Promise<bigint> {
  const state = await prisma.subscriptions_states.findFirst({ where: { name } });
  if (!state) throw new HttpError(500, `Estado de suscripción no configurado: ${name}`);
  return state.id;
}

async function getPaymentStateId(name: string): Promise<bigint> {
  const state = await prisma.payments_states.findFirst({ where: { name } });
  if (!state) throw new HttpError(500, `Estado de pago no configurado: ${name}`);
  return state.id;
}

/** El plan gratuito es el único con price = 0. Toda tienda sin suscripción lo tiene implícito. */
async function getFreePlan() {
  const plan = await prisma.plans.findFirst({
    where: { price: 0, is_active: true },
    orderBy: { id: 'asc' },
  });
  if (!plan) throw new HttpError(500, 'No hay un plan gratuito configurado');
  return plan;
}

function toResponse(row: SubscriptionRow, freePlan: Awaited<ReturnType<typeof getFreePlan>>) {
  if (!row) {
    return { id: null, plan: freePlan, state: 'active', starts_at: null, expires_at: null };
  }
  return {
    id: row.id.toString(),
    plan: row.plans,
    state: row.subscriptions_states?.name ?? null,
    starts_at: row.starts_at,
    expires_at: row.expires_at,
  };
}

/**
 * Termina TODAS las suscripciones activas de la tienda, marcándolas como
 * `expired` (vencimiento natural) o `canceled` (baja voluntaria). No crea
 * ninguna fila nueva: al no quedar suscripción activa, el plan Gratis queda
 * implícito (ver getCurrentSubscription). Es la misma filosofía de
 * "compute, don't store" del plan gratuito — así nunca conviven dos filas
 * activas a la vez.
 */
async function endActiveSubscriptions(storeId: bigint, stateName: 'expired' | 'canceled') {
  const [activeStateId, terminalStateId] = await Promise.all([
    getSubscriptionStateId('active'),
    getSubscriptionStateId(stateName),
  ]);
  await prisma.subscriptions.updateMany({
    where: { store_id: storeId, state_id: activeStateId },
    data: { state_id: terminalStateId },
  });
}

export const subscriptionsService = {
  /**
   * Suscripción vigente de la tienda. Si nunca contrató nada, es el plan
   * gratuito implícito. Si la última suscripción activa ya venció, la
   * "baja" automáticamente al plan gratuito en este mismo llamado (no hay
   * cron: se resuelve la próxima vez que alguien consulta el estado).
   */
  async getCurrentSubscription(storeId: bigint) {
    const activeStateId = await getSubscriptionStateId('active');
    const latest = await prisma.subscriptions.findFirst({
      where: { store_id: storeId, state_id: activeStateId },
      orderBy: { starts_at: 'desc' },
      include: { plans: true, subscriptions_states: true },
    });
    const freePlan = await getFreePlan();

    if (!latest) {
      return toResponse(null, freePlan);
    }

    if (latest.expires_at && latest.expires_at < new Date()) {
      // Venció: la damos de baja y devolvemos el plan Gratis implícito.
      await endActiveSubscriptions(storeId, 'expired');
      return toResponse(null, freePlan);
    }

    return toResponse(latest, freePlan);
  },

  /**
   * Inicia la contratación de un plan. El plan gratuito se activa directo
   * (no pasa por MercadoPago); cualquier otro crea una suscripción `pending`
   * y devuelve la URL de Checkout Pro para que el frontend redirija.
   */
  async startCheckout(storeId: bigint, planId: bigint) {
    const plan = await prisma.plans.findFirst({ where: { id: planId, is_active: true } });
    if (!plan) throw new HttpError(404, 'Plan no encontrado o no disponible');

    if (Number(plan.price) === 0) {
      // El plan Gratis no se "contrata": basta con dar de baja lo pagado y
      // dejarlo implícito. (La UI ya no ofrece contratar Gratis; esto solo
      // mantiene el endpoint coherente si se llama con el plan gratuito.)
      await endActiveSubscriptions(storeId, 'canceled');
      const freePlan = await getFreePlan();
      return { requiresPayment: false as const, subscription: toResponse(null, freePlan) };
    }

    const pendingStateId = await getSubscriptionStateId('pending');
    const pending = await prisma.subscriptions.create({
      data: {
        store_id: storeId,
        plan_id: plan.id,
        state_id: pendingStateId,
        starts_at: null,
        expires_at: null,
      },
    });

    const { init_point } = await createCheckoutPreference({
      title: plan.name,
      price: Number(plan.price),
      externalReference: pending.id.toString(),
    });

    return { requiresPayment: true as const, init_point };
  },

  /**
   * Procesa una notificación de MercadoPago. NUNCA confía en el body del
   * webhook: vuelve a pedir el pago real a la API de MercadoPago con el id
   * recibido, y de ahí saca `status`/`external_reference`.
   */
  async handleWebhook(paymentId: string): Promise<void> {
    const payment = await getPayment(paymentId);
    const subscriptionId = payment.external_reference;
    if (!subscriptionId) return;

    const subscription = await prisma.subscriptions.findUnique({
      where: { id: BigInt(subscriptionId) },
      include: { plans: true },
    });
    if (!subscription) return;
    if (!subscription.plans) {
      throw new HttpError(500, 'La suscripción no tiene un plan asociado');
    }

    const activeStateId = await getSubscriptionStateId('active');
    if (subscription.state_id === activeStateId) return; // ya procesado (idempotencia)

    if (payment.status === 'approved') {
      const [approvedStateId, canceledStateId, expiresAt] = await Promise.all([
        getPaymentStateId('approved'),
        getSubscriptionStateId('canceled'),
        Promise.resolve(addBillingPeriod(new Date(), subscription.plans.billing_period)),
      ]);
      await prisma.$transaction([
        prisma.payments.create({
          data: {
            subscription_id: subscription.id,
            amount: subscription.plans.price,
            currency: 'CLP',
            state_id: approvedStateId,
            paid_at: new Date(),
          },
        }),
        // Cambio de plan: cierra cualquier OTRA suscripción activa de la tienda
        // (ej. el Pro vigente al contratar Premium), para no dejar dos activas.
        prisma.subscriptions.updateMany({
          where: {
            store_id: subscription.store_id,
            state_id: activeStateId,
            id: { not: subscription.id },
          },
          data: { state_id: canceledStateId },
        }),
        prisma.subscriptions.update({
          where: { id: subscription.id },
          data: { state_id: activeStateId, starts_at: new Date(), expires_at: expiresAt },
        }),
      ]);
      return;
    }

    if (payment.status === 'rejected') {
      const rejectedStateId = await getPaymentStateId('rejected');
      await prisma.payments.create({
        data: {
          subscription_id: subscription.id,
          amount: subscription.plans.price,
          currency: 'CLP',
          state_id: rejectedStateId,
          paid_at: null,
        },
      });
    }
    // pending / in_process: sin acción, MercadoPago reenviará otra notificación.
  },

  /**
   * Baja voluntaria del plan pagado vigente. Lo marca como `canceled` y la
   * tienda vuelve al plan Gratis (implícito) de inmediato. Es un MVP: no hay
   * reembolso ni prorrateo por los días no usados. El plan Gratis no se puede
   * "cancelar" (ya es el estado por defecto).
   */
  async cancelSubscription(storeId: bigint) {
    const activeStateId = await getSubscriptionStateId('active');
    const latest = await prisma.subscriptions.findFirst({
      where: { store_id: storeId, state_id: activeStateId },
      orderBy: { starts_at: 'desc' },
      include: { plans: true },
    });

    if (!latest || !latest.plans || Number(latest.plans.price) === 0) {
      throw new HttpError(400, 'No tienes un plan pagado activo para cancelar');
    }

    await endActiveSubscriptions(storeId, 'canceled');
    const freePlan = await getFreePlan();
    return toResponse(null, freePlan);
  },
};
