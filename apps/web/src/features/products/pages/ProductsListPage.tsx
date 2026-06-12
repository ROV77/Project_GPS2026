import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { Badge, Button, Pagination, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { formatCLP } from '@/shared/lib/format';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import type { Product } from '../types';

export function ProductsListPage() {
  const { data: myStore } = useMyStore();
  const { page, limit, onChange } = useTablePagination();
  const { data, isLoading } = useProducts({ page, limit });
  const del = useDeleteProduct();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    del.mutate(id, {
      onSuccess: () => toast.success('Producto eliminado'),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  const columns: Column<Product>[] = [
    { key: 'name', header: 'Nombre', dataIndex: 'name' },
    { key: 'price', header: 'Precio', align: 'right', render: (p) => formatCLP(p.price) },
    { key: 'stock', header: 'Stock', align: 'right', dataIndex: 'stock' },
    {
      key: 'featured',
      header: 'Destacado',
      render: (p) => (p.featured ? <Badge tone="gold">Sí</Badge> : <Badge>No</Badge>),
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: 120,
      render: (p) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            icon={<Pencil className="size-4" />}
            onClick={() => openEdit(p)}
            aria-label="Editar"
          />
          <ConfirmDelete
            title="¿Eliminar este producto?"
            onConfirm={() => handleDelete(p.id)}
            loading={del.isPending}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de tu comercio"
        extra={
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={openCreate}
            disabled={!myStore}
          >
            Nuevo producto
          </Button>
        }
      />

      <Table<Product>
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        emptyText="Sin productos"
      />
      <Pagination
        page={data?.page ?? page}
        pageSize={data?.limit ?? limit}
        total={data?.total ?? 0}
        onChange={onChange}
      />

      <ProductFormDrawer
        open={drawerOpen}
        product={editing}
        storeId={myStore?.id}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
