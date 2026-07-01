import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge, Button } from '@/shared/ui';
import { formatCLP } from '@/shared/lib/format';
import { getApiErrorMessage } from '@/shared/api/errors';
import { usePlans } from '../hooks/usePlans';
import { useMySubscription, useCheckout } from '@/features/subscriptions/hooks/useSubscription';
import type { Plan } from '../types';

/** Mensajes para el ?status= con el que MercadoPago devuelve al usuario a esta página. */
const STATUS_TOASTS: Record<string, { kind: 'success' | 'info' | 'error'; message: string }> = {
  success: { kind: 'success', message: 'Pago aprobado, tu plan se activará en unos segundos.' },
  pending: { kind: 'info', message: 'Tu pago está siendo procesado.' },
  failure: { kind: 'error', message: 'El pago no se pudo completar.' },
};

/**
 * "Elige tu plan": catálogo de planes disponibles con sus ventajas, resalta
 * el plan vigente de la tienda (useMySubscription) y permite contratar uno
 * nuevo (useCheckout). Si el plan tiene costo, redirige al Checkout Pro de
 * MercadoPago; MercadoPago vuelve acá con ?status=success|pending|failure.
 */
export function PlansListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = usePlans({ page: 1, limit: 100 });
  const { data: subscription, refetch: refetchSubscription } = useMySubscription();
  const checkout = useCheckout();

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    const info = STATUS_TOASTS[status];
    if (info?.kind === 'success') toast.success(info.message);
    else if (info?.kind === 'error') toast.error(info.message);
    else if (info) toast(info.message);

    refetchSubscription();
    const next = new URLSearchParams(searchParams);
    next.delete('status');
    setSearchParams(next, { replace: true });
    // Solo debe correr cuando cambian los searchParams de la URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const plans = (data?.data ?? []).filter((plan) => plan.is_active !== false);
  const currentPlanId = subscription?.plan?.id;

  const handleContratar = (plan: Plan) => {
    checkout.mutate(
      { plan_id: plan.id },
      {
        onSuccess: (result) => {
          if (result.requiresPayment && result.init_point) {
            window.location.href = result.init_point;
            return;
          }
          toast.success(`Plan ${plan.name} activado`);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <>
      <PageHeader title="Planes" subtitle="Planes de suscripción para comercios" />

      {subscription && (
        <p className="mb-6 text-sm text-slate-600">
          Tu plan actual: <strong>{subscription.plan.name}</strong>
          {subscription.expires_at && (
            <>
              {' '}
              · vigente hasta{' '}
              {new Date(subscription.expires_at).toLocaleDateString('es-CL')}
            </>
          )}
        </p>
      )}

      {isLoading && <p className="text-sm text-slate-500">Cargando planes...</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <div
              key={plan.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                {isCurrent && <Badge tone="green">Tu plan</Badge>}
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {formatCLP(plan.price)}
                <span className="text-sm font-normal text-slate-500">
                  /{plan.billing_period === 'monthly' ? 'mes' : plan.billing_period}
                </span>
              </p>

              {plan.description && <p className="text-sm text-slate-600">{plan.description}</p>}

              {plan.features && plan.features.length > 0 && (
                <ul className="flex-1 space-y-1 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              )}

              <Button
                variant={isCurrent ? 'default' : 'primary'}
                disabled={isCurrent}
                loading={checkout.isPending}
                onClick={() => handleContratar(plan)}
              >
                {isCurrent ? 'Plan actual' : 'Contratar'}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
