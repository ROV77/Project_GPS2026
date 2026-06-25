import { useState, useMemo } from 'react';
import { Pagination, Table, type Column, Select } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { useCourierRatings, useApplications } from '../hooks/useCouriers';
import { useMyStore } from '@/features/stores/hooks/useStores';
import type { CourierRating, CourierApplication } from '../types';
import { formatDate } from '@/shared/lib/format';
import { Star } from 'lucide-react';

export function RatingsTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  
  // Filter state
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

  // Ratings query (filtered by courier if selected)
  const { data, isLoading } = useCourierRatings({ 
    page, 
    limit, 
    store_id: myStore?.id,
    courier_id: selectedCourierId || undefined 
  });

  // Fetch all applications to extract accepted couriers for this store
  // Only applications that are accepted (state_id === '2' or 2)
  const { data: applicationsData } = useApplications({ page: 1, store_id: myStore?.id, limit: 100 });
  
  const courierOptions = useMemo(() => {
    const apps = Array.isArray(applicationsData) ? applicationsData : (applicationsData?.data ?? []);
    // Filtrar solo las aceptadas
    const acceptedApps = apps.filter((a: CourierApplication) => a.state_id === '2');
    
    // Extraer repartidores únicos
    const uniqueCouriers = new Map<string, string>();
    acceptedApps.forEach((a: CourierApplication) => {
      const courierIdStr = String(a.courier_id);
      if (!uniqueCouriers.has(courierIdStr)) {
        uniqueCouriers.set(courierIdStr, a.users?.name || `Repartidor ID: ${courierIdStr}`);
      }
    });

    return Array.from(uniqueCouriers.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [applicationsData]);

  const columns: Column<CourierRating>[] = [
    { key: 'id', header: 'ID Calificación', dataIndex: 'id' },
    { key: 'courier_id', header: 'Repartidor', render: (r) => r.users?.name || `ID: ${r.courier_id}` },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-brand-900">Historial de Calificaciones</h3>
        
        {/* Filtro Dinámico por Repartidor Aceptado */}
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
