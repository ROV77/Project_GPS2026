import { Eye, Package, Users, ShoppingCart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/shared/lib/cn';
import { Alert, Card } from '@/shared/ui';
import { KpiCard } from '@/shared/components/KpiCard';
import { useProducts } from '@/features/products/hooks/useProducts';

// Datos MOCK: la API aún no expone analytics (visitas, seguidores, pedidos).
// Cuando existan esos endpoints, se reemplazan estas constantes por hooks reales.
const hourlyVisits = [
  { hora: '08h', visitas: 12 },
  { hora: '10h', visitas: 28 },
  { hora: '12h', visitas: 41 },
  { hora: '14h', visitas: 35 },
  { hora: '16h', visitas: 52 },
  { hora: '18h', visitas: 47 },
  { hora: '20h', visitas: 30 },
];

const recentActivity = [
  { dot: 'bg-green-500', text: 'Nuevo seguidor: María López — hace 5 min' },
  { dot: 'bg-blue-500', text: 'Pedido #142 completado — hace 23 min' },
  { dot: 'bg-slate-400', text: 'Producto "Pan amasado" actualizado — hace 1 h' },
];

export function DashboardPage() {
  // Dato REAL: "productos populares" se alimenta del catálogo (primeros 5).
  const { data } = useProducts({ page: 1, limit: 5 });
  const popular = data?.data ?? [];

  return (
    <>
      <Alert
        className="mb-4"
        type="info"
        title="Los KPIs, el gráfico y la actividad son datos de demostración"
        description="La API todavía no expone endpoints de visitas, seguidores ni pedidos. 'Productos populares' sí usa datos reales del catálogo."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Visitas al perfil" value={342} icon={<Eye className="size-5" />} trend={{ value: 12, positive: true }} />
        <KpiCard title="Productos vistos" value={1205} icon={<Package className="size-5" />} trend={{ value: 8, positive: true }} />
        <KpiCard title="Seguidores" value={89} icon={<Users className="size-5" />} trend={{ value: 5, positive: true }} />
        <KpiCard title="Pedidos hoy" value={14} icon={<ShoppingCart className="size-5" />} trend={{ value: 3, positive: false }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Visitas por hora" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyVisits}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visitas" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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

      <div className="mt-4">
        <Card title="Actividad reciente">
          <ol className="space-y-3">
            {recentActivity.map((a) => (
              <li key={a.text} className="flex items-start gap-3 text-sm">
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.dot)} />
                <span className="text-slate-600">{a.text}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
