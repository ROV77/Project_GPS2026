import { Star } from 'lucide-react';
import { Badge, EmptyState } from '@/shared/ui';
import { ProductThumb } from '@/shared/components/ProductThumb';
import { formatCLP } from '@/shared/lib/format';
import type { Product } from '@/features/products/types';

export function FeaturedProductsPanel({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Star className="size-10 text-amber-300" />}
        description="Marca productos como destacados para que aparezcan aquí"
        className="py-10"
      />
    );
  }

  return (
    <ul className="space-y-2">
      {products.map((product) => (
        <li
          key={product.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 transition hover:border-brand-200 hover:bg-brand-50/30"
        >
          <ProductThumb src={product.image_url} alt={product.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
              <Badge tone="gold" className="shrink-0 text-[10px]">
                Destacado
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatCLP(product.price)}</span>
              <span>·</span>
              <span>{product.stock} en stock</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
