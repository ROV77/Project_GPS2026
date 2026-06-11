import { Package, Boxes, Star, MessageSquare } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Alert, Card } from '@/shared/ui';
import { KpiCard } from '@/shared/components/KpiCard';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { useDashboardStats } from '../hooks/useDashboardStats';

export function DashboardPage() {
  const { data: store } = useMyStore();
  const { data: stats } = useDashboardStats(store?.id);

  // "Productos populares" y el gráfico de stock se alimentan del catálogo real.
  const { data } = useProducts({ page: 1, limit: 5 });
  const popular = data?.data ?? [];
  const stockChart = popular.map((p) => ({ name: p.name, stock: p.stock }));

  return (
    <>
      {store && (
        <p className="mb-4 text-sm text-slate-500">
          Resumen de <span className="font-medium text-slate-700">{store.name}</span>
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
          {stockChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stockChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              Aún no hay productos en el catálogo.
            </p>
          )}
        </Card>

        <Card title="Productos populares">
          <ul className="divide-y divide-slate-100">
            {popular.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  #{i + 1} {p.name}
                </span>
                <span className="text-slate-400">Stock {p.stock}</span>
              </li>
            ))}
            {popular.length === 0 && (
              <li className="py-2 text-sm text-slate-400">Sin productos</li>
            )}
          </ul>
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
