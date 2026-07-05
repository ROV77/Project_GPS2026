import { useState } from 'react';
import { Calendar, Mail, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Id } from '@/shared/api/types';
import {
  Badge,
  Button,
  ConfirmPopover,
  Drawer,
  EmptyState,
  Pagination,
  Table,
  type Column,
} from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { getApiErrorMessage } from '@/shared/api/errors';
import { getInitials, formatDate } from '@/shared/lib/format';
import { useApplications, useUpdateApplication } from '../hooks/useCouriers';
import type { CourierApplication } from '../types';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { Star } from 'lucide-react';
import { CourierReviewsModal } from './CourierReviewsModal';

function applicationState(stateId: Id | null) {
  if (String(stateId) === '2') return { label: 'Aceptada', tone: 'green' as const };
  if (String(stateId) === '3') return { label: 'Rechazada', tone: 'red' as const };
  return { label: 'Pendiente', tone: 'gold' as const };
}

function CourierAvatar({ name }: { name?: string | null }) {
  const initials = getInitials(name) || '?';
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
      {initials}
    </span>
  );
}

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
    update.mutate(
      { id, data: { state_id: newState } },
      {
        onSuccess: () => {
          toast.success('Estado de postulación actualizado');
          setSelectedApp(null);
        },
        onError: (e) => toast.error(getApiErrorMessage(e)),
      },
    );
  };

  const columns: Column<CourierApplication>[] = [
    {
      key: 'courier',
      header: 'Repartidor',
      render: (a) => (
        <div className="flex items-center gap-3">
          <CourierAvatar name={a.users?.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {a.users?.name || `Repartidor #${a.courier_id}`}
            </p>
            {a.users?.email ? (
              <p className="truncate text-xs text-muted-foreground">{a.users.email}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'applied_at',
      header: 'Fecha',
      render: (a) => (
        <span className="text-sm text-muted-foreground">{formatDate(a.applied_at)}</span>
      ),
    },
    {
      key: 'state_id',
      header: 'Estado',
      render: (a) => {
        const state = applicationState(a.state_id);
        return <Badge tone={state.tone}>{state.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 130,
      render: (a) => (
        <Button size="sm" variant="default" onClick={() => setSelectedApp(a)}>
          Ver detalle
        </Button>
      ),
    },
  ];

  const selectedState = selectedApp ? applicationState(selectedApp.state_id) : null;
  const isAccepted = String(selectedApp?.state_id) === '2';
  const isRejected = String(selectedApp?.state_id) === '3';

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">Postulaciones recibidas</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Revisa quién quiere repartir para tu tienda y acepta o rechaza cada postulación.
          </p>
        </div>

        <div className="[&>div]:rounded-none [&>div]:border-0">
          <Table<CourierApplication>
            columns={columns}
            data={data?.data ?? []}
            loading={isLoading}
            emptyText={
              <EmptyState
                icon={<Users className="size-10 text-brand-300" />}
                description="Aún no hay postulaciones a tus vacantes"
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

      <Drawer
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Detalle de la postulación"
      >
        {selectedApp ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <CourierAvatar name={selectedApp.users?.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  {selectedApp.users?.name || `Repartidor #${selectedApp.courier_id}`}
                </p>
                {selectedApp.users?.email ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    {selectedApp.users.email}
                  </p>
                ) : null}
              </div>
              {selectedState ? <Badge tone={selectedState.tone}>{selectedState.label}</Badge> : null}
            </div>

            {selectedApp.users?.courier_ratings && (
              <div 
                className="flex items-center justify-between bg-yellow-50/50 p-3 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-50 transition-colors"
                onClick={() => {
                  setSelectedReviewsCourierId(String(selectedApp.courier_id));
                  setSelectedReviewsCourierName(selectedApp.users?.name || 'Repartidor');
                  setReviewsModalOpen(true);
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs text-yellow-700/80 uppercase tracking-wide font-semibold mb-1">
                    Calificación
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-yellow-900 text-lg">
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

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vacante
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selectedApp.delivery_vacancies?.description || 'Sin descripción'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              Postuló el {formatDate(selectedApp.applied_at)}
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <ConfirmPopover
                className="relative flex w-full"
                title="¿Aceptar a este repartidor? Podrá trabajar contigo según lo acordado."
                confirmText="Aceptar"
                onConfirm={() => handleUpdateState(selectedApp.id, 2)}
                loading={update.isPending}
                triggerClassName={cn(
                  'flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-800 disabled:opacity-70',
                  isAccepted && 'pointer-events-none opacity-50',
                )}
              >
                <UserCheck className="size-4" />
                {isAccepted ? 'Ya aceptado' : 'Aceptar repartidor'}
              </ConfirmPopover>

              <ConfirmPopover
                className="relative flex w-full"
                title="¿Rechazar esta postulación? El repartidor será notificado del cambio."
                confirmText="Rechazar"
                onConfirm={() => handleUpdateState(selectedApp.id, 3)}
                loading={update.isPending}
                triggerClassName={cn(
                  'flex h-10 w-full items-center justify-center rounded-lg border border-red-200 bg-card px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-70',
                  isRejected && 'pointer-events-none opacity-50',
                )}
              >
                {isRejected ? 'Ya rechazado' : 'Rechazar postulación'}
              </ConfirmPopover>
            </div>
          </div>
        ) : null}
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
