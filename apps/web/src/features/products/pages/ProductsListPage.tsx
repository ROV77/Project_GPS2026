import { useEffect, useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Plus, Pencil, Search, Star, PackageX, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { ProductThumb } from '@/shared/components/ProductThumb';
import { Badge, Button, Input, Pagination, Select, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { formatCLP } from '@/shared/lib/format';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { LOW_STOCK_THRESHOLD, type Product, type ProductSort } from '../types';

const SORT_OPTIONS = [
  { value: 'id_asc', label: 'Por defecto' },
  { value: 'stock_desc', label: 'Stock (mayor)' },
  { value: 'stock_asc', label: 'Stock (menor)' },
  { value: 'price_desc', label: 'Precio (mayor)' },
  { value: 'price_asc', label: 'Precio (menor)' },
];

/** Muestra el stock con badge cuando está agotado o bajo el umbral. */
function StockCell({ stock }: { stock: number }) {
  if (stock === 0) return <Badge tone="red">Sin stock</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge tone="gold">Bajo · {stock}</Badge>;
  return <span className="tabular-nums text-slate-700">{stock}</span>;
}

export function ProductsListPage() {
  const { data: myStore } = useMyStore();
  const { page, limit, setPage, onChange } = useTablePagination();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [featured, setFeatured] = useState(false);
  const [lowStock, setLowStock] = useState(false);
  const [sort, setSort] = useState<ProductSort>('id_asc');

  // Debounce de la búsqueda (300 ms) para no pegarle a la API en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Al cambiar cualquier filtro, volver a la primera página.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, featured, lowStock, sort, setPage]);

  const { data, isLoading } = useProducts({
    page,
    limit,
    search: debouncedSearch || undefined,
    featured: featured || undefined,
    lowStock: lowStock || undefined,
    sort,
  });
  const del = useDeleteProduct();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

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
    {
      key: 'thumb',
      header: '',
      width: 56,
      render: (p) =>
        p.image_url ? (
          <button
            type="button"
            onClick={() => setPreview({ src: p.image_url!, alt: p.name })}
            className="block rounded-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Ver imagen de ${p.name}`}
          >
            <ProductThumb src={p.image_url} alt={p.name} />
          </button>
        ) : (
          <ProductThumb src={p.image_url} alt={p.name} />
        ),
    },
    { key: 'name', header: 'Nombre', dataIndex: 'name' },
    { key: 'price', header: 'Precio', align: 'right', render: (p) => formatCLP(p.price) },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <StockCell stock={p.stock} /> },
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

      {/* Toolbar: búsqueda + filtros + orden */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            prefix={<Search className="size-4" />}
          />
        </div>
        <Button
          size="sm"
          variant={featured ? 'primary' : 'default'}
          icon={<Star className="size-4" />}
          onClick={() => setFeatured((v) => !v)}
        >
          Destacados
        </Button>
        <Button
          size="sm"
          variant={lowStock ? 'primary' : 'default'}
          icon={<PackageX className="size-4" />}
          onClick={() => setLowStock((v) => !v)}
        >
          Stock bajo
        </Button>
        <div className="ml-auto w-full sm:w-44">
          <Select
            value={sort}
            onChange={(v) => setSort((v as ProductSort) ?? 'id_asc')}
            options={SORT_OPTIONS}
            placeholder="Ordenar"
          />
        </div>
      </div>

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

      {/* Vista ampliada de la imagen del producto (clic en la miniatura de la tabla) */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative max-h-[85vh] max-w-lg">
            {preview && (
              <img
                src={preview.src}
                alt={preview.alt}
                className="max-h-[85vh] w-full rounded-lg object-contain shadow-xl"
              />
            )}
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md hover:text-slate-900"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
