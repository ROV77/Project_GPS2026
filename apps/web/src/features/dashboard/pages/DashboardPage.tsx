import { Package, Boxes, Star, MessageSquare } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Alert, Card, EmptyState } from '@/shared/ui';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { KpiCard } from '@/shared/components/KpiCard';
import { ProductThumb } from '@/shared/components/ProductThumb';
import { formatCLP } from '@/shared/lib/format';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useDashboardStats } from '../hooks/useDashboardStats';

/** Paleta de la dona/barras: tokens de marca (navy) definidos en index.css. */
const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const stockChartConfig = {
  stock: { label: 'Stock' },
} satisfies ChartConfig;

export function DashboardPage() {
  const { data: store } = useMyStore();
  const { data: stats } = useDashboardStats(store?.id);

  // Top productos por stock para el gráfico (Bar Chart - Mixed).
  const { data: topStock } = useProducts({ page: 1, limit: 6, sort: 'stock_desc' });
  const stockData = (topStock?.data ?? []).map((p, i) => ({
    name: p.name,
    stock: p.stock,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Productos destacados (dato real: featured = true).
  const { data: featuredData } = useProducts({ page: 1, limit: 5, featured: true });
  const featured = featuredData?.data ?? [];

  return (
    <>
      {store && (
        <p className="mb-4 text-sm text-muted-foreground">
          Resumen de <span className="font-medium text-foreground">{store.name}</span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Productos en catálogo"
          value={stats?.product_count ?? 0}
          icon={<Package className="size-5" />}
        />
        <KpiCard
          title="Stock total"
          value={stats?.total_stock ?? 0}
          icon={<Boxes className="size-5" />}
        />
        <KpiCard
          title="Reseñas recibidas"
          value={stats?.review_count ?? 0}
          icon={<MessageSquare className="size-5" />}
        />
        <KpiCard
          title="Rating promedio"
          value={stats?.avg_rating ?? 0}
          suffix="/ 5"
          icon={<Star className="size-5" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Stock por producto" className="lg:col-span-2">
          {stockData.length > 0 ? (
            <ChartContainer config={stockChartConfig} className="h-[280px] w-full">
              <BarChart
                accessibilityLayer
                data={stockData}
                layout="vertical"
                margin={{ left: 12, right: 16 }}
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tickFormatter={(v: string) =>
                    v.length > 16 ? `${v.slice(0, 16)}…` : v
                  }
                />
                <XAxis dataKey="stock" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="stock" radius={5} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState description="Aún no hay productos en el catálogo." />
          )}
        </Card>

        <Card title="Productos destacados">
          {featured.length > 0 ? (
            <ul className="divide-y divide-border">
              {featured.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <ProductThumb src={p.image_url} alt={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCLP(p.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Star className="size-10" />}
              description="Marca productos como destacados para que aparezcan aquí."
            />
          )}
        </Card>
      </div>

      <Alert
        className="mt-4"
        type="info"
        title="Próximamente: analítica de visitas"
        description="Las métricas de visitas, seguidores y pedidos requieren el módulo de analytics, que aún no está disponible en la API."
      />
    </>
  );
}
