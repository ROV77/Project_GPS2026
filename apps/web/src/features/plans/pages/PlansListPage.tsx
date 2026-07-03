import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge, Button, ConfirmPopover } from '@/shared/ui';
import { formatCLP } from '@/shared/lib/format';
import { getApiErrorMessage } from '@/shared/api/errors';
import { usePlans } from '../hooks/usePlans';
import {
  useMySubscription,
  useCheckout,
  useCancelSubscription,
} from '@/features/subscriptions/hooks/useSubscription';
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
  const cancel = useCancelSubscription();

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
  const currentPlan = subscription?.plan;
  // ¿La tienda ya tiene un plan PAGO vigente? Entonces contratar otro es un
  // cambio de plan que le hace perder los días restantes: avisamos antes.
  const hasActivePaidPlan = currentPlan ? Number(currentPlan.price) > 0 : false;
  const currentExpiresText = subscription?.expires_at
    ? ` (vigente hasta ${new Date(subscription.expires_at).toLocaleDateString('es-CL')})`
    : '';

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

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('Cancelaste tu plan. Volviste al plan Gratis.'),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
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
          const isFree = Number(plan.price) === 0;
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

              {isCurrent && isFree && (
                <Button variant="default" disabled>
                  Plan actual
                </Button>
              )}

              {isCurrent && !isFree && (
                <ConfirmPopover
                  className="relative flex w-full"
                  title="¿Cancelar tu plan? Volverás al plan Gratis de inmediato y perderás los días que te queden."
                  confirmText="Cancelar plan"
                  onConfirm={handleCancel}
                  loading={cancel.isPending}
                  triggerClassName="flex h-10 w-full items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
                >
                  Cancelar suscripción
                </ConfirmPopover>
              )}

              {!isCurrent && isFree && (
                <Button variant="default" disabled>
                  Plan por defecto
                </Button>
              )}

              {!isCurrent && !isFree && hasActivePaidPlan && (
                <ConfirmPopover
                  className="relative flex w-full"
                  title={`Ya tienes ${currentPlan?.name}${currentExpiresText}. Al contratar ${plan.name} perderás los días restantes, sin reembolso. ¿Continuar al pago?`}
                  confirmText="Ir a pagar"
                  onConfirm={() => handleContratar(plan)}
                  loading={checkout.isPending}
                  triggerClassName="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-800"
                >
                  Contratar
                </ConfirmPopover>
              )}

              {!isCurrent && !isFree && !hasActivePaidPlan && (
                <Button
                  variant="primary"
                  loading={checkout.isPending}
                  onClick={() => handleContratar(plan)}
                >
                  Contratar
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
