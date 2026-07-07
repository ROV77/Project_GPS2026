import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { Badge, Button, Skeleton, Table, type Column } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { formatCLP } from '@/shared/lib/format';
import { useCapabilities } from '@/features/subscriptions/hooks/useSubscription';
import { UpgradeBanner } from '@/features/subscriptions/components/UpgradeBanner';
import { usePromotions, useDeletePromotion } from '../hooks/usePromotions';
import { PromotionFormDrawer } from '../components/PromotionFormDrawer';
import { promotionBadge, discountedPriceText } from '../lib/promotionDisplay';
import type { Promotion } from '../types';

/** dd-mm-yyyy a partir del ISO de una columna DATE (sin desfase de zona horaria). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${m}-${y}`;
}

function vigenciaText(p: Promotion): string {
  const from = p.valid_from ? formatDate(p.valid_from) : null;
  const to = p.valid_until ? formatDate(p.valid_until) : null;
  if (from && to) return `${from} → ${to}`;
  if (from) return `Desde ${from}`;
  if (to) return `Hasta ${to}`;
  return 'Sin límite';
}

/** Precio del producto según la promo: con descuento (texto) o el original. */
function PriceCell({ promotion }: { promotion: Promotion }) {
  const discounted = discountedPriceText(promotion.products.price, promotion);
  if (!discounted) return <span>{formatCLP(promotion.products.price)}</span>;
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-xs text-muted-foreground line-through">{discounted.original}</span>
      <span className="font-medium text-foreground">{discounted.final}</span>
    </span>
  );
}

export function PromotionsListPage() {
  const { canUsePromotions } = useCapabilities();
  const { data: promotions, isLoading } = usePromotions();
  const del = useDeletePromotion();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (promotion: Promotion) => {
    setEditing(promotion);
    setDrawerOpen(true);
  };

  const handleDelete = (id: Promotion['id']) => {
    del.mutate(id, {
      onSuccess: () => toast.success('Promoción eliminada'),
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  // Defensa por si se navega a /promociones por URL sin plan Pro (el menú ya lo oculta).
  if (!canUsePromotions) {
    return (
      <>
        <PageHeader title="Promociones" subtitle="Ofertas y descuentos de tu tienda" />
        <UpgradeBanner
          title="Promociones · plan Pro"
          description="Mejora a Pro para crear descuentos y promociones 2x1/3x2 sobre tus productos."
        />
      </>
    );
  }

  const columns: Column<Promotion>[] = [
    {
      key: 'product',
      header: 'Producto',
      render: (p) => <span className="font-medium text-foreground">{p.products.name}</span>,
    },
    {
      key: 'promo',
      header: 'Promoción',
      render: (p) => <Badge tone="blue">{promotionBadge(p)}</Badge>,
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (p) => <PriceCell promotion={p} />,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (p) =>
        p.is_active ? <Badge tone="green">Activa</Badge> : <Badge tone="gray">Inactiva</Badge>,
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      render: (p) => <span className="text-sm text-muted-foreground">{vigenciaText(p)}</span>,
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
            title="¿Eliminar esta promoción?"
            onConfirm={() => handleDelete(p.id)}
            loading={del.isPending}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Promociones" subtitle="Ofertas y descuentos de tu tienda" />

      <div className="mb-4 flex justify-end">
        <Button variant="primary" icon={<Plus className="size-4" />} onClick={openCreate}>
          Nueva promoción
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Table<Promotion>
          columns={columns}
          data={promotions ?? []}
          loading={false}
          emptyText="Aún no tienes promociones. Crea la primera con “Nueva promoción”."
        />
      )}

      <PromotionFormDrawer
        open={drawerOpen}
        promotion={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
