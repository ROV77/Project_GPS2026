import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState, Pagination, Select, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { useCourierRatings, useApplications } from '../hooks/useCouriers';
import { useMyStore } from '@/features/stores/hooks/useStores';
import type { CourierRating, CourierApplication } from '../types';
import { formatDate } from '@/shared/lib/format';

function StarRating({ value }: { value: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-4',
            i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200',
          )}
          strokeWidth={1.5}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function RatingsTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

  const { data, isLoading } = useCourierRatings({
    page,
    limit,
    store_id: myStore?.id,
    courier_id: selectedCourierId || undefined,
  });

  const { data: applicationsData } = useApplications({
    page: 1,
    store_id: myStore?.id,
    limit: 100,
  });

  const courierOptions = useMemo(() => {
    const apps = applicationsData?.data ?? [];
    const acceptedApps = apps.filter((a: CourierApplication) => a.state_id === '2');
    const uniqueCouriers = new Map<string, string>();
    acceptedApps.forEach((a: CourierApplication) => {
      const courierIdStr = String(a.courier_id);
      if (!uniqueCouriers.has(courierIdStr)) {
        uniqueCouriers.set(courierIdStr, a.users?.name || `Repartidor #${courierIdStr}`);
      }
    });
    return Array.from(uniqueCouriers.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [applicationsData]);

  const columns: Column<CourierRating>[] = [
    {
      key: 'courier_id',
      header: 'Repartidor',
      render: (r) => (
        <span className="font-medium text-foreground">
          {r.users?.name || `Repartidor #${r.courier_id}`}
        </span>
      ),
    },
    {
      key: 'stars',
      header: 'Calificación',
      render: (r) => <StarRating value={Number(r.stars)} />,
    },
    {
      key: 'comment',
      header: 'Comentario',
      render: (r) => (
        <span className="line-clamp-2 text-sm text-muted-foreground">{r.comment || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      render: (r) => (
        <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Historial de calificaciones</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Revisa cómo has evaluado a tus repartidores aceptados.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={selectedCourierId}
              onChange={setSelectedCourierId}
              options={courierOptions}
              placeholder="Filtrar por repartidor..."
              allowClear
            />
          </div>
        </div>

        <div className="[&>div]:rounded-none [&>div]:border-0">
          <Table<CourierRating>
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            emptyText={
              <EmptyState
                icon={<Star className="size-10 text-brand-300" />}
                description="No has registrado calificaciones para ningún repartidor"
                className="py-8"
              />
            }
          />
        </div>
      </div>

      <Pagination
        page={data?.page ?? page}
        pageSize={data?.limit ?? limit}
        total={data?.total ?? 0}
        onChange={onChange}
      />
    </div>
  );
}
