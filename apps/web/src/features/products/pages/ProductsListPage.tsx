import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { LayoutGrid, List, Plus, Pencil, Search, Star, PackageX, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { ProductThumb } from '@/shared/components/ProductThumb';
import { optimizeImagePreviewUrl } from '@/shared/ui/CloudinaryImg';
import { Badge, Button, Input, Pagination, Select, Skeleton, Table, type Column } from '@/shared/ui';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { formatCLP } from '@/shared/lib/format';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { ProductCardGrid } from '../components/ProductCardGrid';
import { ProductStatsCards } from '../components/ProductStatsCards';
import { LOW_STOCK_THRESHOLD, type Product, type ProductSort } from '../types';

const SORT_OPTIONS = [
  { value: 'id_asc', label: 'Por defecto' },
  { value: 'stock_desc', label: 'Stock (mayor)' },
  { value: 'stock_asc', label: 'Stock (menor)' },
  { value: 'price_desc', label: 'Precio (mayor)' },
  { value: 'price_asc', label: 'Precio (menor)' },
];

type ViewMode = 'grid' | 'table';

function StockCell({ stock }: { stock: number }) {
  if (stock === 0) return <Badge tone="red">Sin stock</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge tone="gold">Bajo · {stock}</Badge>;
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-sm tabular-nums font-medium text-emerald-700">
      {stock}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition',
        active
          ? 'bg-brand-700 text-white shadow-sm'
          : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function ProductsListPage() {
  const { data: myStore } = useMyStore();
  const { page, limit, setPage, onChange } = useTablePagination();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [featured, setFeatured] = useState(false);
  const [lowStock, setLowStock] = useState(false);
  const [sort, setSort] = useState<ProductSort>('id_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

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

  const { data: statsSource } = useProducts({ page: 1, limit: 100, sort: 'id_asc' });

  const stats = useMemo(() => {
    const items = statsSource?.data ?? [];
    return {
      total: statsSource?.total ?? items.length,
      featured: items.filter((p) => p.featured).length,
      lowStock: items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
      outOfStock: items.filter((p) => p.stock === 0).length,
    };
  }, [statsSource]);

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
      width: 64,
      render: (p) =>
        p.image_url ? (
          <button
            type="button"
            onClick={() => setPreview({ src: p.image_url!, alt: p.name })}
            className="block rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`Ver imagen de ${p.name}`}
          >
            <ProductThumb src={p.image_url} alt={p.name} size="md" />
          </button>
        ) : (
          <ProductThumb src={p.image_url} alt={p.name} size="md" />
        ),
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{p.name}</span>
          {p.featured ? <Star className="size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} /> : null}
        </div>
      ),
    },
    { key: 'price', header: 'Precio', align: 'right', render: (p) => formatCLP(p.price) },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <StockCell stock={p.stock} /> },
    {
      key: 'featured',
      header: 'Destacado',
      render: (p) => (p.featured ? <Badge tone="gold">Sí</Badge> : <span className="text-muted-foreground">No</span>),
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

  const products = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader title="Productos" subtitle="Catálogo de tu comercio" />

      <ProductStatsCards {...stats} className="mb-5" />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              prefix={<Search className="size-4" />}
            />
          </div>
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={openCreate}
            disabled={!myStore}
          >
            Nuevo producto
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={featured} onClick={() => setFeatured((v) => !v)} icon={<Star className="size-4" />}>
            Destacados
          </FilterChip>
          <FilterChip
            active={lowStock}
            onClick={() => setLowStock((v) => !v)}
            icon={<PackageX className="size-4" />}
          >
            Stock bajo
          </FilterChip>

          <div className="ml-auto flex items-center gap-2">
            <div className="w-40">
              <Select
                value={sort}
                onChange={(v) => setSort((v as ProductSort) ?? 'id_asc')}
                options={SORT_OPTIONS}
                placeholder="Ordenar"
              />
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-2 transition',
                  viewMode === 'grid' ? 'bg-brand-700 text-white' : 'text-muted-foreground hover:bg-muted',
                )}
                aria-label="Vista en cuadrícula"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'rounded-md p-2 transition',
                  viewMode === 'table' ? 'bg-brand-700 text-white' : 'text-muted-foreground hover:bg-muted',
                )}
                aria-label="Vista en tabla"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <ProductCardGrid
          products={products}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPreviewImage={(src, alt) => setPreview({ src, alt })}
          deleteLoading={del.isPending}
        />
      ) : (
        <Table<Product> columns={columns} data={products} loading={false} emptyText="Sin productos" />
      )}

      {total > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Mostrando {products.length} de {total} producto{total === 1 ? '' : 's'}
          </span>
          <Pagination
            page={data?.page ?? page}
            pageSize={data?.limit ?? limit}
            total={total}
            onChange={onChange}
          />
        </div>
      ) : null}

      <ProductFormDrawer
        open={drawerOpen}
        product={editing}
        storeId={myStore?.id}
        onClose={() => setDrawerOpen(false)}
      />

      <Dialog open={!!preview} onClose={() => setPreview(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative max-h-[85vh] max-w-lg">
            {preview && (
              <img
                src={optimizeImagePreviewUrl(preview.src) ?? preview.src}
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
