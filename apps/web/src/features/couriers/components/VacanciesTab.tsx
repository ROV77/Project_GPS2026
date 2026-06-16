import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { Button, Pagination, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useVacancies, useDeleteVacancy } from '../hooks/useCouriers';
import { VacancyFormDrawer } from './VacancyFormDrawer';
import type { DeliveryVacancy } from '../types';
import { formatDate } from '@/shared/lib/format';

export function VacanciesTab() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  // Solo obtener vacantes de MI tienda
  const { data, isLoading } = useVacancies({ page, limit, store_id: myStore?.id });
  const del = useDeleteVacancy();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryVacancy | null>(null);

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

  const columns: Column<DeliveryVacancy>[] = [
    { 
      key: 'description', 
      header: 'Descripción', 
      render: (v) => <div className="max-w-md truncate">{v.description || 'Sin descripción'}</div> 
    },
    { 
      key: 'created_at', 
      header: 'Fecha de publicación', 
      render: (v) => formatDate(v.created_at) 
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 120,
      render: (v) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            icon={<Pencil className="size-4" />}
            onClick={() => openEdit(v)}
            aria-label="Editar"
          />
          <ConfirmDelete
            title="¿Eliminar esta vacante?"
            onConfirm={() => handleDelete(v.id)}
            loading={del.isPending}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-brand-900">Bolsa de Trabajo</h3>
        <Button
          variant="primary"
          icon={<Plus className="size-4" />}
          onClick={openCreate}
          disabled={!myStore}
        >
          Publicar vacante
        </Button>
      </div>

      <Table<DeliveryVacancy>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="No tienes vacantes publicadas"
      />
      
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.limit ?? limit}
        total={data?.total ?? 0}
        onChange={onChange}
      />

      <VacancyFormDrawer
        open={drawerOpen}
        vacancy={editing}
        storeId={myStore?.id}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
