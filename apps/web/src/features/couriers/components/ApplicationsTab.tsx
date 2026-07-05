import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Pagination, Table, type Column, Badge, Drawer, ConfirmPopover } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useApplications, useUpdateApplication } from '../hooks/useCouriers';
import type { CourierApplication } from '../types';
import { formatDate } from '@/shared/lib/format';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { Star } from 'lucide-react';
import { CourierReviewsModal } from './CourierReviewsModal';

export function ApplicationsTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = useApplications({ page, limit, store_id: myStore?.id });
  const update = useUpdateApplication();

  const [selectedApp, setSelectedApp] = useState<CourierApplication | null>(null);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [selectedReviewsCourierId, setSelectedReviewsCourierId] = useState<string | null>(null);
  const [selectedReviewsCourierName, setSelectedReviewsCourierName] = useState<string>('');

  const handleUpdateState = (id: string, newState: number) => {
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
        if (a.state_id === '2') return <Badge tone="green">Aceptada</Badge>;
        if (a.state_id === '3') return <Badge tone="red">Rechazada</Badge>;
        return <Badge tone="gold">Pendiente</Badge>;
      } 
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 120,
      render: (a) => (
        <Button size="sm" variant="default" onClick={() => setSelectedApp(a)}>
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
              {selectedApp.users?.courier_ratings && (
                <div 
                  className="mt-4 flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => {
                    setSelectedReviewsCourierId(String(selectedApp.courier_id));
                    setSelectedReviewsCourierName(selectedApp.users?.name || 'Repartidor');
                    setReviewsModalOpen(true);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-yellow-700 uppercase tracking-wide font-semibold mb-1">
                      Calificación
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-yellow-800 text-lg">
                        {selectedApp.users.courier_ratings.length > 0
                          ? (selectedApp.users.courier_ratings.reduce((acc, r) => acc + (r.stars ?? 0), 0) / selectedApp.users.courier_ratings.length).toFixed(1)
                          : 'S/N'}
                      </span>
                      <Star className="size-5 text-yellow-500 fill-current" />
                      <span className="text-sm text-yellow-700 ml-1">
                        ({selectedApp.users.courier_ratings.length} opiniones)
                      </span>
                    </div>
                  </div>
                  <div className="text-brand-600 font-medium text-sm hover:underline">
                    Ver opiniones
                  </div>
                </div>
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
                {selectedApp.state_id === '2' ? <Badge tone="green">Aceptada</Badge> : 
                 selectedApp.state_id === '3' ? <Badge tone="red">Rechazada</Badge> : 
                 <Badge tone="gold">Pendiente</Badge>}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
              <ConfirmPopover
                className="w-full relative"
                triggerClassName="w-full flex items-center justify-center h-10 px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-md text-sm font-medium transition-colors"
                title="¿Estás seguro de que deseas aceptar a este repartidor?"
                confirmText="Aceptar"
                onConfirm={() => handleUpdateState(selectedApp.id, 2)}
                disabled={selectedApp.state_id === '2' || update.isPending}
              >
                Aceptar Repartidor
              </ConfirmPopover>
              
              <ConfirmPopover
                className="w-full relative"
                triggerClassName="w-full flex items-center justify-center h-10 px-4 py-2 border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                title="¿Estás seguro de que deseas rechazar a este repartidor?"
                confirmText="Rechazar"
                onConfirm={() => handleUpdateState(selectedApp.id, 3)}
                disabled={selectedApp.state_id === '3' || update.isPending}
              >
                Rechazar Repartidor
              </ConfirmPopover>
            </div>
          </div>
        )}
      </Drawer>

      <CourierReviewsModal 
        isOpen={reviewsModalOpen}
        onClose={() => setReviewsModalOpen(false)}
        courierId={selectedReviewsCourierId}
        courierName={selectedReviewsCourierName}
      />
    </div>
  );
}
