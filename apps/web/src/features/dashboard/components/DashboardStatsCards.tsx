import { MessageSquare, Package, Star, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStatsCardsProps {
  productCount: number;
  totalStock: number;
  reviewCount: number;
  avgRating: number;
  className?: string;
}

const items = [
  {
    key: 'productCount',
    label: 'Productos en catálogo',
    icon: Package,
    tone: 'text-brand-700 bg-brand-50',
  },
  {
    key: 'totalStock',
    label: 'Stock total',
    icon: Warehouse,
    tone: 'text-emerald-700 bg-emerald-50',
  },
  {
    key: 'reviewCount',
    label: 'Reseñas recibidas',
    icon: MessageSquare,
    tone: 'text-violet-700 bg-violet-50',
  },
  {
    key: 'avgRating',
    label: 'Rating promedio',
    icon: Star,
    tone: 'text-amber-700 bg-amber-50',
  },
] as const;

export function DashboardStatsCards({
  productCount,
  totalStock,
  reviewCount,
  avgRating,
  className,
}: DashboardStatsCardsProps) {
  const values = { productCount, totalStock, reviewCount, avgRating };

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {items.map(({ key, label, icon: Icon, tone }) => {
        const raw = values[key];
        const display =
          key === 'avgRating'
            ? raw > 0
              ? raw.toFixed(1)
              : '—'
            : String(raw);

        return (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs"
          >
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tone)}>
              <Icon className="size-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{display}</p>
              <p className="text-xs text-muted-foreground">
                {key === 'avgRating' && raw > 0 ? `${label} · / 5` : label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
