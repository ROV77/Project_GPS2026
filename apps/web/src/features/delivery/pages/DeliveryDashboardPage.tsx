import { Navigate, useNavigate } from 'react-router-dom';
import { Bike, LogOut, Mail, CheckCircle2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/stores/authStore';
import logoUrl from '@/assets/icons/logo_caseritapp.png';
import { useVacancies, useCreateApplication } from '@/features/couriers/hooks/useCouriers';
import { getApiErrorMessage } from '@/shared/api/errors';
import { formatDate } from '@/shared/lib/format';

/**
 * Dashboard del repartidor (rol delivery). Shell autocontenido (no usa el
 * AdminLayout de la tienda). Muestra el perfil y las vacantes disponibles.
 */
export function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: vacanciesData, isLoading } = useVacancies({ page: 1, limit: 50 });
  const applyMutation = useCreateApplication();

  // Gate por rol: si no es repartidor, al panel de tienda.
  if (!user?.roles?.includes('delivery')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleApply = (vacancyId: string) => {
    if (!user) return;
    applyMutation.mutate(
      { vacancy_id: Number(vacancyId), courier_id: Number(user.id) },
      {
        onSuccess: () => toast.success('¡Postulación enviada exitosamente!'),
        onError: (err) => toast.error(getApiErrorMessage(err) || 'Error al postular'),
      }
    );
  };

  // Las vacantes vienen dentro de `data` si es paginado, o es un array directo dependiendo de la respuesta.
  const vacancies = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData?.data ?? []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <img src={logoUrl} alt="CaseritApp" className="h-9 w-auto" />
        <Button variant="ghost" icon={<LogOut className="size-4" />} onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
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

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* Perfil en la columna izquierda */}
          <div className="lg:col-span-1">
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
          </div>

          {/* Vacantes disponibles en las columnas derecha */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="size-5 text-brand-600" />
              Oportunidades de Reparto
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : vacancies.length === 0 ? (
              <Card>
                <p className="py-8 text-center text-sm text-slate-500">
                  Por el momento no hay vacantes publicadas por las tiendas.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {vacancies.map((vacancy: any) => (
                  <Card key={vacancy.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-900">
                          Vacante de entrega (Tienda ID: {vacancy.store_id})
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {vacancy.description || 'Sin descripción detallada.'}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Publicada el {formatDate(vacancy.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleApply(vacancy.id)}
                        loading={applyMutation.isPending}
                        disabled={applyMutation.isPending}
                      >
                        Postular
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
