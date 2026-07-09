import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState, Pagination, Skeleton } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useVacancies, useDeleteVacancy } from '../hooks/useCouriers';
import { VacancyFormDrawer } from './VacancyFormDrawer';
import { VacancyCard } from './VacancyCard';
import type { DeliveryVacancy } from '../types';

export function VacanciesTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = useVacancies({ page, limit, store_id: myStore?.id });
  const del = useDeleteVacancy();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryVacancy | null>(null);

  const vacancies = data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (vacancy: DeliveryVacancy) => {
    setEditing(vacancy);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    del.mutate(id, {
      onSuccess: () => toast.success('Vacante eliminada'),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Publicaciones</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Publica ofertas para que repartidores de la zona postulen a tu tienda.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={openCreate}
            disabled={!myStore}
          >
            Publicar vacante
          </Button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : vacancies.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="size-10 text-brand-300" />}
              description={
                <span className="text-center">
                  Aún no tienes vacantes publicadas.
                  <br />
                  <button
                    type="button"
                    onClick={openCreate}
                    disabled={!myStore}
                    className="mt-2 font-medium text-brand-700 hover:underline disabled:opacity-50"
                  >
                    Publica la primera vacante
                  </button>
                </span>
              }
              className="py-14"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {vacancies.map((vacancy) => (
                <VacancyCard
                  key={vacancy.id}
                  vacancy={vacancy}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deleting={del.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(data?.total ?? 0) > 0 ? (
        <Pagination
          page={data?.page ?? page}
          pageSize={data?.limit ?? limit}
          total={data?.total ?? 0}
          onChange={onChange}
        />
      ) : null}

      <VacancyFormDrawer
        open={drawerOpen}
        vacancy={editing}
        storeId={myStore?.id}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
