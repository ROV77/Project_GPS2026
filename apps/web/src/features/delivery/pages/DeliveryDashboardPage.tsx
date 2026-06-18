import { Navigate, useNavigate } from 'react-router-dom';
import { Bike, LogOut, Mail, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/authStore';
import logoUrl from '@/assets/icons/logo_caseritapp.png';

/**
 * Dashboard del repartidor (rol delivery). Shell autocontenido (no usa el
 * AdminLayout de la tienda). Por ahora: bienvenida + perfil.
 */
export function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Gate por rol: si no es repartidor, al panel de tienda.
  if (!user?.roles?.includes('delivery')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <img src={logoUrl} alt="CaseritApp" className="h-9 w-auto" />
        <Button variant="ghost" icon={<LogOut className="size-4" />} onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Bike className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Hola, {user.name ?? 'repartidor'}
            </h1>
            <Badge tone="green">Repartidor disponible</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card title="Tu perfil">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-slate-400" />
                {user.email}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Cuenta activa como repartidor
              </li>
            </ul>
          </Card>

          <Card title="Próximamente">
            <p className="text-sm text-slate-600">
              Pronto verás aquí las tiendas y oportunidades de reparto disponibles
              cerca de ti.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
