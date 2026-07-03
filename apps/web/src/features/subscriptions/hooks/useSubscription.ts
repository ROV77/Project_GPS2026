import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptionsApi';

const KEY = 'subscription';

/** Suscripción vigente de la tienda (plan gratuito implícito si nunca contrató). */
export function useMySubscription() {
  return useQuery({
    queryKey: [KEY],
    queryFn: subscriptionsApi.getMine,
  });
}

/** Inicia la contratación de un plan (activación directa si es gratis, o checkout de MercadoPago). */
export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.checkout,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** Cancela el plan pagado vigente: la tienda vuelve al plan Gratis. */
export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subscriptionsApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
