import { api } from '@/shared/api/client';
import type { CheckoutInput } from '@caserita/validations';
import type { Subscription, CheckoutResult } from '../types';

/**
 * Funciones puras de acceso a /api/subscriptions. Ver features/products/api
 * para el patrón: solo hacen la llamada, los hooks de TanStack Query las usan.
 */
export const subscriptionsApi = {
  getMine: () => api.get<Subscription>('/subscriptions/me').then((r) => r.data),

  checkout: (data: CheckoutInput) =>
    api.post<CheckoutResult>('/subscriptions/checkout', data).then((r) => r.data),
};
