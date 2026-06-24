import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Pagination, Table, type Column, Badge, Drawer } from '@/shared/ui';
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

  const [selectedApp, setSelectedApp] = useState<CourierApplication | null>(null);

  const handleUpdateState = (id: string, newState: number) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${newState === 2 ? 'aceptar' : 'rechazar'} a este repartidor?`)) return;
    
    update.mutate({ id, data: { state_id: newState } }, {
      onSuccess: () => {
        toast.success('Estado de postulación actualizado');
        setSelectedApp(null);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  const columns: Column<CourierApplication>[] = [
    { key: 'id', header: 'ID Postulación', dataIndex: 'id' },
    { key: 'courier', header: 'Repartidor', render: (a) => a.users?.name || `ID: ${a.courier_id}` },
    { key: 'applied_at', header: 'Fecha', render: (a) => formatDate(a.applied_at) },
    { 
      key: 'state_id', 
      header: 'Estado', 
      render: (a) => {
        if (a.state_id === '2' || a.state_id === 2) return <Badge tone="green">Aceptada</Badge>;
        if (a.state_id === '3' || a.state_id === 3) return <Badge tone="red">Rechazada</Badge>;
        return <Badge tone="gold">Pendiente</Badge>;
      } 
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 120,
      render: (a) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedApp(a)}>
          Ver detalle
        </Button>
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

      <Drawer
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Detalle de la Postulación"
      >
        {selectedApp && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-1">Repartidor</h4>
              <p className="text-slate-900 font-medium">{selectedApp.users?.name || `ID: ${selectedApp.courier_id}`}</p>
              {selectedApp.users?.email && (
                <p className="text-sm text-slate-600">{selectedApp.users.email}</p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-1">Vacante a la que postuló (ID: {selectedApp.vacancy_id})</h4>
              <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 whitespace-pre-wrap border border-slate-100">
                {selectedApp.delivery_vacancies?.description || 'Sin descripción'}
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Fecha</h4>
                <p className="text-sm text-slate-900">{formatDate(selectedApp.applied_at)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Estado</h4>
                {selectedApp.state_id === '2' || selectedApp.state_id === 2 ? <Badge tone="green">Aceptada</Badge> : 
                 selectedApp.state_id === '3' || selectedApp.state_id === 3 ? <Badge tone="red">Rechazada</Badge> : 
                 <Badge tone="gold">Pendiente</Badge>}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => handleUpdateState(selectedApp.id, 2)} 
                disabled={selectedApp.state_id === '2' || selectedApp.state_id === 2 || update.isPending}
              >
                Aceptar Repartidor
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => handleUpdateState(selectedApp.id, 3)} 
                disabled={selectedApp.state_id === '3' || selectedApp.state_id === 3 || update.isPending}
              >
                Rechazar Repartidor
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
