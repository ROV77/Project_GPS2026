import { toast } from 'sonner';
import { Button, Pagination, Table, type Column, Badge } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useApplications, useUpdateApplication } from '../hooks/useCouriers';
import type { CourierApplication } from '../types';
import { formatDate } from '@/shared/lib/format';

import { useMyStore } from '@/features/stores/hooks/useStores';

export function ApplicationsTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = useApplications({ page, limit, store_id: myStore?.id });
  const update = useUpdateApplication();

  const handleUpdateState = (id: string, newState: number) => {
    update.mutate({ id, data: { state_id: newState } }, {
      onSuccess: () => toast.success('Estado de postulación actualizado'),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  const columns: Column<CourierApplication>[] = [
    { key: 'id', header: 'ID Postulación', dataIndex: 'id' },
    { key: 'courier_id', header: 'ID Repartidor', dataIndex: 'courier_id' },
    { key: 'vacancy_id', header: 'ID Vacante', dataIndex: 'vacancy_id' },
    { key: 'applied_at', header: 'Fecha', render: (a) => formatDate(a.applied_at) },
    { 
      key: 'state_id', 
      header: 'Estado', 
      render: (a) => {
        // Asumiendo 1=Pendiente, 2=Aceptada, 3=Rechazada basado en convenciones comunes
        if (a.state_id === '2') return <Badge tone="green">Aceptada</Badge>;
        if (a.state_id === '3') return <Badge tone="red">Rechazada</Badge>;
        return <Badge tone="gold">Pendiente</Badge>;
      } 
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 180,
      render: (a) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => handleUpdateState(a.id, 2)} 
            disabled={a.state_id === '2' || update.isPending}
          >
            Aceptar
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => handleUpdateState(a.id, 3)} 
            disabled={a.state_id === '3' || update.isPending}
          >
            Rechazar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-brand-900">Postulaciones Recibidas</h3>
      <Table<CourierApplication>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="Aún no hay postulaciones a tus vacantes"
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
