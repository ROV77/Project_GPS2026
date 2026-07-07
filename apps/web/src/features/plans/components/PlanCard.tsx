import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Check, LineChart, Store } from 'lucide-react';
import confetti from 'canvas-confetti';
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
  isSelected?: boolean;
  onSelect?: () => void;
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
  isSelected,
  onSelect,
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

  const cardRef = useRef<HTMLElement>(null);

  // Get brand colors
  let colors = ['#94a3b8', '#64748b', '#cbd5e1'];
  if (plan.name === 'Pro') colors = ['#2563eb', '#60a5fa', '#3b82f6', '#93c5fd']; // brand
  else if (plan.name === 'Premium') colors = ['#d97706', '#fbbf24', '#f59e0b', '#fcd34d']; // amber

  const handleCardClick = () => {
    if (isSelected) return;
    if (onSelect) onSelect();
    
    // Initial big explosion
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x, y },
        colors: colors,
        disableForReducedMotion: true,
        zIndex: 100,
      });
    }
  };

  useEffect(() => {
    if (!isSelected) return;

    // Continuous slow particles
    const interval = setInterval(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        // Spread origin across the card width and height slightly
        const x = (rect.left + (Math.random() * rect.width)) / window.innerWidth;
        const y = (rect.top + (Math.random() * rect.height)) / window.innerHeight;

        confetti({
          particleCount: 1,
          spread: 360,
          origin: { x, y },
          colors: [colors[Math.floor(Math.random() * colors.length)]],
          disableForReducedMotion: true,
          zIndex: 40,
          ticks: 200,
          gravity: 0.1, // very slow fall
          scalar: 0.8 + Math.random() * 0.4, // variable small size
          shapes: ['circle'],
          startVelocity: 10,
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isSelected, colors]);

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-6 shadow-xs transition-all duration-500 cursor-pointer',
        isRecommended && !isCurrent && !isSelected && 'z-10 border-brand-700 shadow-md md:scale-[1.02]',
        isCurrent && !isSelected && 'border-emerald-300 bg-emerald-50/30',
        !isRecommended && !isCurrent && !isSelected && 'border-border hover:border-brand-200 hover:shadow-sm',
        isSelected && 'scale-[1.05] shadow-2xl z-50 ring-4 border-transparent',
        isSelected && plan.name === 'Pro' && 'ring-brand-500/50 shadow-brand-500/20 bg-brand-50/10',
        isSelected && plan.name === 'Premium' && 'ring-amber-500/50 shadow-amber-500/20 bg-amber-50/10',
        isSelected && plan.name !== 'Pro' && plan.name !== 'Premium' && 'ring-slate-400/50',
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
