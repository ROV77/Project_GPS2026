import { formatCLP, getInitials } from '@/shared/lib/format';
import { Badge } from '@/components/ui/badge';
import type { PublicProduct } from '../types';

interface PublicProductCardProps {
  product: PublicProduct;
}

export function PublicProductCard({ product }: PublicProductCardProps) {
  const outOfStock = product.stock === 0;

  return (
    <article className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt=""
          className="size-20 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
        />
      ) : (
        <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
          {getInitials(product.name)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-foreground">{product.name}</h3>
          {product.featured ? <Badge tone="gold">Destacado</Badge> : null}
          {outOfStock ? <Badge tone="red">Sin stock</Badge> : null}
        </div>

        {product.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        ) : null}

        <p className="mt-2 font-semibold text-foreground">{formatCLP(product.price)}</p>
      </div>
    </article>
  );
}
