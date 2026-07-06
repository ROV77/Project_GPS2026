import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/shared/ui';

interface UpgradeBannerProps {
  /** Título breve; por defecto anuncia que es una función de pago. */
  title?: string;
  /** Explica qué desbloquea el plan superior. */
  description: string;
  /** Texto del botón que lleva a /planes. */
  cta?: string;
}

/**
 * Aviso reutilizable para invitar a mejorar de plan. Es solo experiencia
 * (mejora la UX y evita frustración); el candado real vive en el backend.
 * Se usa como fallback de <PlanGate> y en cualquier sección bloqueada.
 */
export function UpgradeBanner({
  title = 'Función del plan Pro',
  description,
  cta = 'Ver planes',
}: UpgradeBannerProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-brand-200 bg-gradient-to-r from-brand-50/80 to-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Sparkles className="size-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-900">{title}</p>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-brand-800/80">{description}</p>
        </div>
      </div>
      <Link to="/planes" className={cn(buttonVariants({ variant: 'primary' }), 'shrink-0')}>
        {cta}
      </Link>
    </div>
  );
}
