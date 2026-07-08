import { LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, buttonVariants } from '@/shared/ui';
import { PlanGate } from '@/features/subscriptions/components/PlanGate';

const SUPPORT_WHATSAPP =
  'https://wa.me/56912345678?text=Hola,%20necesito%20soporte%20analitico%20para%20mi%20tienda';

export function AnalyticsSupportCard() {
  return (
    <PlanGate feature="canViewStats" fallback={<></>}>
      <Card className="mt-6 max-w-xl">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <LifeBuoy className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Soporte analítico</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu plan incluye atención analítica: escríbenos y te ayudamos con tus métricas.
            </p>
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'primary' }), 'mt-3')}
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </Card>
    </PlanGate>
  );
}