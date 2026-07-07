import { BarChart3, LineChart, Star } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, Skeleton } from '@/shared/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useCapabilities } from '@/features/subscriptions/hooks/useSubscription';
import { PlanGate } from '@/features/subscriptions/components/PlanGate';
import { UpgradeBanner } from '@/features/subscriptions/components/UpgradeBanner';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { DashboardStatsCards } from '../components/DashboardStatsCards';
import { FeaturedProductsPanel } from '../components/FeaturedProductsPanel';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const stockChartConfig = {
  stock: { label: 'Unidades' },
} satisfies ChartConfig;

export function DashboardPage() {
  const { canViewStats } = useCapabilities();
  const { data: store, isLoading: loadingStore } = useMyStore();
  const { data: stats, isLoading: loadingStats } = useDashboardStats(store?.id, canViewStats);

  const { data: topStock, isLoading: loadingStockChart } = useProducts({
    page: 1,
    limit: 6,
    sort: 'stock_desc',
  });
  const stockData = (topStock?.data ?? []).map((p, i) => ({
    name: p.name,
    stock: p.stock,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const { data: featuredData, isLoading: loadingFeatured } = useProducts({
    page: 1,
    limit: 5,
    featured: true,
  });
  const featured = featuredData?.data ?? [];

  const loadingKpis = loadingStore || loadingStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          store
            ? `Métricas y rendimiento de ${store.name}`
            : 'Resumen de tu comercio en CaseritApp'
        }
      />

      <PlanGate
        feature="canViewStats"
        fallback={
          <UpgradeBanner
            title="Estadísticas · plan Pro"
            description="Mejora a Pro para ver las métricas de tu tienda: productos, stock, reseñas y calificación promedio."
          />
        }
      >
      {loadingKpis ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-xl" />
          ))}
        </div>
      ) : (
        <DashboardStatsCards
          productCount={stats?.product_count ?? 0}
          totalStock={stats?.total_stock ?? 0}
          reviewCount={stats?.review_count ?? 0}
          avgRating={stats?.avg_rating ?? 0}
        />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs lg:col-span-2">
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <BarChart3 className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Stock por producto</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Top 6 productos con más inventario en tu catálogo.
              </p>
            </div>
          </div>

          <div className="p-5">
            {loadingStockChart ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : stockData.length > 0 ? (
              <ChartContainer config={stockChartConfig} className="h-[280px] w-full">
                <BarChart
                  accessibilityLayer
                  data={stockData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={128}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 18)}…` : v)}
                  />
                  <XAxis dataKey="stock" type="number" hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="stock" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState description="Aún no hay productos en el catálogo." className="py-12" />
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Star className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Productos destacados</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Los que marcaste para resaltar en la app.
              </p>
            </div>
          </div>

          <div className="p-4">
            {loadingFeatured ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-xl" />
                ))}
              </div>
            ) : (
              <FeaturedProductsPanel products={featured} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-dashed border-brand-200 bg-gradient-to-r from-brand-50/80 to-slate-50 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <LineChart className="size-5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-900">Próximamente: analítica de visitas</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-800/80">
            Visitas a tu tienda, seguidores y pedidos llegarán cuando activemos el módulo de
            analytics en la API. Mientras tanto, revisa stock, reseñas y productos destacados.
          </p>
        </div>
      </div>
      </PlanGate>
    </div>
  );
}
