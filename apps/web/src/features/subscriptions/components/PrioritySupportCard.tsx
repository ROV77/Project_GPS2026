import { LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, buttonVariants } from '@/shared/ui';
import { PlanGate } from './PlanGate';

// Canal de soporte preferente. Reemplazar por el número/correo real del equipo.
const SUPPORT_WHATSAPP =
  'https://wa.me/56912345678?text=Hola,%20soy%20vendedor%20Premium%20y%20necesito%20soporte';

/**
 * Sección de "soporte prioritario", una ventaja del plan Premium. Visible solo
 * para tiendas con la capacidad `prioritySupport`; para el resto no se muestra
 * nada (fallback vacío, sin upsell).
 */
export function PrioritySupportCard() {
  return (
    <PlanGate feature="prioritySupport" fallback={<></>}>
      <Card className="mt-6 max-w-xl">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <LifeBuoy className="size-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Soporte prioritario</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu plan Premium incluye atención preferente: escríbenos y te respondemos primero.
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
