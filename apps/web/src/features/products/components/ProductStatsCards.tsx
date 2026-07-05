import { Package, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductStatsCardsProps {
  total: number;
  featured: number;
  lowStock: number;
  outOfStock: number;
  className?: string;
}

const items = [
  { key: 'total', label: 'Productos', icon: Package, tone: 'text-brand-700 bg-brand-50' },
  { key: 'featured', label: 'Destacados', icon: Star, tone: 'text-amber-700 bg-amber-50' },
  { key: 'lowStock', label: 'Stock bajo', icon: AlertTriangle, tone: 'text-orange-700 bg-orange-50' },
  { key: 'outOfStock', label: 'Sin stock', icon: Package, tone: 'text-red-700 bg-red-50' },
] as const;

export function ProductStatsCards({
  total,
  featured,
  lowStock,
  outOfStock,
  className,
}: ProductStatsCardsProps) {
  const values = { total, featured, lowStock, outOfStock };

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {items.map(({ key, label, icon: Icon, tone }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs"
        >
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tone)}>
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{values[key]}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
