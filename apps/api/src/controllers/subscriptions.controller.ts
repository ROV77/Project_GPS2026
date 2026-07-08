import { Request, Response } from 'express';
import type { CheckoutInput, ConfirmInput } from '@caserita/validations';
import { subscriptionsService } from '../services/subscriptions.service';
import { getPlanCapabilities } from '../services/plan-access.service';
import { parseBigIntId } from '../lib/http';

export const getMySubscription = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const data = await subscriptionsService.getCurrentSubscription(storeId);
  // Adjuntamos las capacidades del plan vigente para que el frontend condicione
  // la UI (mostrar/ocultar funciones) sin tener que conocer la regla de negocio.
  const capabilities = getPlanCapabilities(data.plan);
  res.json({ ...data, capabilities });
};

export const checkout = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const { plan_id } = res.locals.body as CheckoutInput;
  const planId = parseBigIntId(plan_id);
  if (planId === null) {
    res.status(400).json({ error: 'ID de plan inválido' });
    return;
  }
  const data = await subscriptionsService.startCheckout(storeId, planId);
  res.status(201).json(data);
};

/**
 * Confirma el pago al volver del Checkout Pro. El frontend llama esto con el
 * `payment_id` que MercadoPago adjunta a la URL de retorno, para activar el
 * plan en el acto sin depender de que el webhook haya llegado. Devuelve la
 * suscripción vigente (con capacidades), igual que GET /me.
 */
export const confirmCheckout = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const { payment_id } = res.locals.body as ConfirmInput;
  const data = await subscriptionsService.confirmCheckout(storeId, payment_id);
  const capabilities = getPlanCapabilities(data.plan);
  res.json({ ...data, capabilities });
};

export const cancelSubscription = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const data = await subscriptionsService.cancelSubscription(storeId);
  res.json(data);
};

/**
 * Extrae el id de pago de una notificación de MercadoPago. Soporta el
 * formato de webhook actual (JSON body { type, data: { id } }) y el legacy
 * IPN por query params (?topic=payment&id=...).
 */
function extractPaymentId(req: Request): string | null {
  const body = req.body as { type?: string; data?: { id?: string | number } } | undefined;
  if (body?.type === 'payment' && body.data?.id) {
    return String(body.data.id);
  }
  const topic = req.query.topic ?? req.query.type;
  const id = req.query.id;
  if (topic === 'payment' && id) {
    return String(id);
  }
  return null;
}

/**
 * Webhook público (sin auth) que llama MercadoPago. Siempre responde 200
 * rápido: si no reconoce la notificación, la ignora en vez de fallar, para
 * que MercadoPago no la siga reintentando indefinidamente.
 */
export const webhook = async (req: Request, res: Response) => {
  const paymentId = extractPaymentId(req);
  if (paymentId) {
    await subscriptionsService.handleWebhook(paymentId);
  }
  res.sendStatus(200);
};
