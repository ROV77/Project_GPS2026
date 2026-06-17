import { Pagination, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { useCourierRatings } from '../hooks/useCouriers';
import { useMyStore } from '@/features/stores/hooks/useStores';
import type { CourierRating } from '../types';
import { formatDate } from '@/shared/lib/format';
import { Star } from 'lucide-react';

export function RatingsTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = useCourierRatings({ page, limit, store_id: myStore?.id });

  const columns: Column<CourierRating>[] = [
    { key: 'id', header: 'ID Calificación', dataIndex: 'id' },
    { key: 'courier_id', header: 'ID Repartidor', dataIndex: 'courier_id' },
    { 
      key: 'stars', 
      header: 'Calificación', 
      render: (r) => (
        <div className="flex items-center gap-1 font-medium">
          {r.stars} <Star className="size-4 text-yellow-500 fill-current" />
        </div>
      )
    },
    { key: 'comment', header: 'Comentario', render: (r) => r.comment || '-' },
    { key: 'created_at', header: 'Fecha', render: (r) => formatDate(r.created_at) },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-brand-900">Historial de Calificaciones</h3>
      <Table<CourierRating>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="No has registrado calificaciones para ningún repartidor"
      />
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.limit ?? limit}
        total={data?.total ?? 0}
        onChange={onChange}
      />
    </div>
  );
}
