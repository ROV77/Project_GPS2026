import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Check, LineChart, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, Button, ConfirmPopover } from '@/shared/ui';
import { formatCLP } from '@/shared/lib/format';
import type { Plan } from '../types';

const PLAN_META: Record<
  string,
  { tagline: string; Icon: LucideIcon; accent: string; iconBg: string }
> = {
  Gratis: {
    tagline: 'Para empezar',
    Icon: Store,
    accent: 'text-slate-700',
    iconBg: 'bg-slate-100 text-slate-600',
  },
  Pro: {
    tagline: 'Para tiendas activas',
    Icon: LineChart,
    accent: 'text-brand-700',
    iconBg: 'bg-brand-50 text-brand-700',
  },
  Premium: {
    tagline: 'Para destacar en tu comuna',
    Icon: BadgeCheck,
    accent: 'text-amber-700',
    iconBg: 'bg-amber-50 text-amber-700',
  },
};

function getPlanMeta(name: string) {
  return (
    PLAN_META[name] ?? {
      tagline: 'Plan disponible',
      Icon: Store,
      accent: 'text-brand-700',
      iconBg: 'bg-brand-50 text-brand-700',
    }
  );
}

function dailyPriceHint(price: number): string | null {
  if (price <= 0) return null;
  const daily = Math.round(price / 30);
  return `≈ ${formatCLP(daily)}/día`;
}

export interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isRecommended: boolean;
  isFree: boolean;
  hasActivePaidPlan: boolean;
  currentPlanName?: string;
  currentExpiresText: string;
  checkoutLoading: boolean;
  cancelLoading: boolean;
  onContratar: (plan: Plan) => void;
  onCancel: () => void;
}

export function PlanCard({
  plan,
  isCurrent,
  isRecommended,
  isFree,
  hasActivePaidPlan,
  currentPlanName,
  currentExpiresText,
  checkoutLoading,
  cancelLoading,
  onContratar,
  onCancel,
}: PlanCardProps) {
  const meta = getPlanMeta(plan.name);
  const Icon = meta.Icon;
  const price = Number(plan.price);
  const dailyHint = dailyPriceHint(price);

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-6 shadow-xs transition',
        isRecommended && !isCurrent && 'z-10 border-brand-700 shadow-md md:scale-[1.02]',
        isCurrent && 'border-emerald-300 bg-emerald-50/30',
        !isRecommended && !isCurrent && 'border-border hover:border-brand-200 hover:shadow-sm',
      )}
    >
      {isRecommended && !isCurrent ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-700 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          Recomendado
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn('flex size-11 items-center justify-center rounded-xl', meta.iconBg)}>
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className={cn('text-lg font-bold', meta.accent)}>{plan.name}</h3>
            <p className="text-xs text-muted-foreground">{meta.tagline}</p>
          </div>
        </div>
        {isCurrent ? <Badge tone="green">Tu plan</Badge> : null}
      </div>

      <div className="mt-5">
        <p className="text-3xl font-bold tabular-nums text-foreground">
          {formatCLP(plan.price)}
          <span className="text-sm font-normal text-muted-foreground">
            /{plan.billing_period === 'monthly' ? 'mes' : plan.billing_period}
          </span>
        </p>
        {dailyHint ? <p className="mt-0.5 text-xs text-muted-foreground">{dailyHint}</p> : null}
      </div>

      {plan.description ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
      ) : null}

      {plan.features && plan.features.length > 0 ? (
        <ul className="mt-4 flex-1 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}

      <div className="mt-6 space-y-2">
        {isCurrent && isFree ? (
          <Button variant="default" disabled className="w-full">
            Plan actual
          </Button>
        ) : null}

        {isCurrent && !isFree ? (
          <>
            {currentExpiresText ? (
              <p className="text-center text-xs text-muted-foreground">{currentExpiresText.trim()}</p>
            ) : null}
            <ConfirmPopover
              className="relative flex w-full"
              title="¿Cancelar tu plan? Volverás al plan Gratis de inmediato y perderás los días que te queden."
              confirmText="Cancelar plan"
              onConfirm={onCancel}
              loading={cancelLoading}
              triggerClassName="flex h-10 w-full items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
            >
              Cancelar suscripción
            </ConfirmPopover>
          </>
        ) : null}

        {!isCurrent && isFree ? (
          <Button variant="default" disabled className="w-full">
            Incluido al registrarte
          </Button>
        ) : null}

        {!isCurrent && !isFree && hasActivePaidPlan ? (
          <ConfirmPopover
            className="relative flex w-full"
            title={`Ya tienes ${currentPlanName}${currentExpiresText}. Al contratar ${plan.name} perderás los días restantes, sin reembolso. ¿Continuar al pago?`}
            confirmText="Ir a pagar"
            onConfirm={() => onContratar(plan)}
            loading={checkoutLoading}
            triggerClassName={cn(
              'flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-70',
              isRecommended
                ? 'bg-brand-700 text-white hover:bg-brand-800'
                : 'border border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {isRecommended ? `Subir a ${plan.name}` : `Contratar ${plan.name}`}
          </ConfirmPopover>
        ) : null}

        {!isCurrent && !isFree && !hasActivePaidPlan ? (
          <Button
            variant={isRecommended ? 'primary' : 'default'}
            loading={checkoutLoading}
            onClick={() => onContratar(plan)}
            className="w-full"
          >
            {isRecommended ? `Subir a ${plan.name}` : `Contratar ${plan.name}`}
          </Button>
        ) : null}

        {!isCurrent && !isFree ? (
          <p className="text-center text-[11px] text-muted-foreground">Pago seguro con Mercado Pago</p>
        ) : null}
      </div>
    </article>
  );
}
