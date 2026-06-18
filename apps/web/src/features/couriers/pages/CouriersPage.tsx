import { Bike, Mail, Phone } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableCouriers } from '../hooks/useCouriers';

/**
 * "Repartidores": vista de solo lectura. La tienda NO publica vacantes; aquí
 * visualiza los repartidores disponibles (usuarios con rol delivery).
 */
export function CouriersPage() {
  const { data: couriers, isLoading } = useAvailableCouriers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repartidores"
        subtitle="Repartidores disponibles para tus entregas. Contáctalos directamente."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !couriers || couriers.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay repartidores disponibles.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {couriers.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Bike className="size-5" />
                  </span>
                  <p className="font-medium text-foreground">
                    {c.name ?? 'Repartidor'}
                  </p>
                </div>
                <Badge tone="green">Disponible</Badge>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-slate-400" />
                  {c.email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-slate-400" />
                  {c.phone || 'Sin teléfono'}
                </li>
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
