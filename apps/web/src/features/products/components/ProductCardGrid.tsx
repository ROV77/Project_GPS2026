import { Pencil, Star } from 'lucide-react';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { Badge, Button } from '@/shared/ui';
import { formatCLP, getInitials } from '@/shared/lib/format';
import { CloudinaryImg } from '@/shared/ui/CloudinaryImg';
import { LOW_STOCK_THRESHOLD, type Product } from '../types';

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge tone="red">Sin stock</Badge>;
  if (stock <= LOW_STOCK_THRESHOLD) return <Badge tone="gold">Bajo · {stock}</Badge>;
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Stock · {stock}
    </span>
  );
}

interface ProductCardGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPreviewImage?: (src: string, alt: string) => void;
  deleteLoading?: boolean;
}

export function ProductCardGrid({
  products,
  onEdit,
  onDelete,
  onPreviewImage,
  deleteLoading,
}: ProductCardGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">Aún no hay productos</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Crea tu primer producto para que aparezca en la app de tus clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="group overflow-hidden rounded-xl border border-border bg-card shadow-xs transition hover:border-brand-200 hover:shadow-sm"
        >
          <button
            type="button"
            className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
            onClick={() =>
              product.image_url && onPreviewImage?.(product.image_url, product.name)
            }
            disabled={!product.image_url}
          >
            {product.image_url ? (
              <CloudinaryImg
                src={product.image_url}
                alt={product.name}
                displayWidthPx={400}
                className="size-full object-cover transition group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                <span className="text-3xl font-bold text-brand-700">
                  {getInitials(product.name) || '?'}
                </span>
              </div>
            )}
            {product.featured ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                <Star className="size-3 fill-white" strokeWidth={0} />
                Destacado
              </span>
            ) : null}
          </button>

          <div className="space-y-3 p-4">
            <div>
              <h3 className="line-clamp-1 font-semibold text-foreground">{product.name}</h3>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-brand-700">
                {formatCLP(product.price)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <StockBadge stock={product.stock} />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  icon={<Pencil className="size-4" />}
                  onClick={() => onEdit(product)}
                  aria-label={`Editar ${product.name}`}
                />
                <ConfirmDelete
                  title="¿Eliminar este producto?"
                  onConfirm={() => onDelete(product.id)}
                  loading={deleteLoading}
                />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
