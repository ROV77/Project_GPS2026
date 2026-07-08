import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { usePlans } from '../hooks/usePlans';
import {
  useMySubscription,
  useCheckout,
  useConfirmCheckout,
  useCancelSubscription,
} from '@/features/subscriptions/hooks/useSubscription';
import type { Plan } from '../types';
import { PlanCard } from '../components/PlanCard';
import { PlanComparisonTable } from '../components/PlanComparisonTable';

const RECOMMENDED_PLAN = 'Pro';

const STATUS_TOASTS: Record<string, { kind: 'success' | 'info' | 'error'; message: string }> = {
  success: { kind: 'success', message: 'Pago aprobado, tu plan se activará en unos segundos.' },
  pending: { kind: 'info', message: 'Tu pago está siendo procesado.' },
  failure: { kind: 'error', message: 'El pago no se pudo completar.' },
};

import { useState } from 'react';

export function PlansListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlanId, setSelectedPlanId] = useState<number | string | null>(null);
  const { data, isLoading } = usePlans({ page: 1, limit: 100 });
  const { data: subscription, refetch: refetchSubscription } = useMySubscription();
  const checkout = useCheckout();
  const confirm = useConfirmCheckout();
  const cancel = useCancelSubscription();

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    // MercadoPago adjunta el id del pago a la URL de retorno (payment_id, o
    // collection_id en integraciones antiguas). Con él confirmamos el pago en
    // el acto en vez de esperar el webhook, que en sandbox puede tardar o no
    // llegar; si no viene, caemos al comportamiento antiguo (toast + refetch).
    const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id');

    if (status === 'success' && paymentId) {
      confirm.mutate(paymentId, {
        onSuccess: (data) =>
          toast.success(`¡Pago aprobado! Tu plan ${data.plan.name} ya está activo.`),
        onError: () => {
          toast(STATUS_TOASTS.pending.message);
          refetchSubscription();
        },
      });
    } else {
      const info = STATUS_TOASTS[status];
      if (info?.kind === 'success') toast.success(info.message);
      else if (info?.kind === 'error') toast.error(info.message);
      else if (info) toast(info.message);
      refetchSubscription();
    }

    // Limpia los params que agrega MercadoPago (status, payment_id, etc.).
    setSearchParams(new URLSearchParams(), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const plans = (data?.data ?? []).filter((plan) => plan.is_active !== false);
  const currentPlanId = subscription?.plan?.id;
  const currentPlan = subscription?.plan;
  const hasActivePaidPlan = currentPlan ? Number(currentPlan.price) > 0 : false;
  const currentExpiresText = subscription?.expires_at
    ? `Vigente hasta ${new Date(subscription.expires_at).toLocaleDateString('es-CL')}`
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
      <PageHeader
        title="Planes"
        subtitle="Muestra más productos, destaca tu tienda y mide tus ventas"
      />

      {subscription ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand-700 text-white">
            <Receipt className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-brand-900">
              Tu plan actual: <span className="font-bold">{subscription.plan.name}</span>
            </p>
            <p className="text-xs text-brand-800/80">
              {subscription.expires_at
                ? `Renovación / vigencia hasta ${new Date(subscription.expires_at).toLocaleDateString('es-CL')}`
                : 'Plan base incluido con tu cuenta'}
            </p>
          </div>
          {Number(subscription.plan.price) === 0 ? (
            <p className="flex items-center gap-1 text-xs font-medium text-brand-700">
              <LineChart className="size-3.5" />
              Mejora a Pro para crecer
            </p>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
                isSelected={plan.id === selectedPlanId}
                onSelect={() => setSelectedPlanId(plan.id)}
                isRecommended={plan.name === RECOMMENDED_PLAN}
                isFree={Number(plan.price) === 0}
                hasActivePaidPlan={hasActivePaidPlan}
                currentPlanName={currentPlan?.name}
                currentExpiresText={currentExpiresText}
                checkoutLoading={checkout.isPending}
                cancelLoading={cancel.isPending}
                onContratar={handleContratar}
                onCancel={handleCancel}
              />
            ))}
          </div>

          <PlanComparisonTable plans={plans} />
        </>
      )}
    </>
  );
}
