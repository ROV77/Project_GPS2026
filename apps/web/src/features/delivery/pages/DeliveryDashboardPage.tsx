import { Navigate, useNavigate } from 'react-router-dom';
import { Bike, LogOut, Mail, CheckCircle2, Briefcase, Star, ClipboardList, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/features/auth/stores/authStore';
import logoUrl from '@/assets/icons/logo_caseritapp.webp';
import { useVacancies, useCreateApplication, useApplications, useCourierRatings } from '@/features/couriers/hooks/useCouriers';
import { getApiErrorMessage } from '@/shared/api/errors';
import { formatDate } from '@/shared/lib/format';
import type { CourierApplication, DeliveryVacancy, CourierRating } from '@/features/couriers/types';

/**
 * Dashboard del repartidor (rol delivery). Shell autocontenido (no usa el
 * AdminLayout de la tienda). Muestra el perfil y las vacantes disponibles.
 */
export function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Queries
  const { data: vacanciesData, isLoading: isLoadingVacancies } = useVacancies({ page: 1, limit: 100 });
  const { data: applicationsData, isLoading: isLoadingApps, refetch: refetchApps } = useApplications({ page: 1, courier_id: user?.id, limit: 100 });
  const { data: ratingsData } = useCourierRatings({ page: 1, courier_id: user?.id, limit: 100 });
  
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
        onSuccess: () => {
          toast.success('¡Postulación enviada exitosamente!');
          refetchApps();
        },
        onError: (err) => toast.error(getApiErrorMessage(err) || 'Error al postular'),
      }
    );
  };

  // Safe arrays
  const allVacancies = Array.isArray(vacanciesData) ? vacanciesData : (vacanciesData?.data ?? []);
  const myApplications = Array.isArray(applicationsData) ? applicationsData : (applicationsData?.data ?? []);
  const myRatings = Array.isArray(ratingsData) ? ratingsData : (ratingsData?.data ?? []);

  // Filter available vacancies (exclude the ones I already applied to)
  const appliedVacancyIds = new Set(myApplications.map((a: CourierApplication) => String(a.vacancy_id)));
  const availableVacancies = allVacancies.filter((v: DeliveryVacancy) => !appliedVacancyIds.has(String(v.id)));

  // Calculate average rating
  const averageStars = myRatings.length > 0
    ? myRatings.reduce((acc: number, curr: CourierRating) => acc + (curr.stars || 0), 0) / myRatings.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <img src={logoUrl} alt="CaseritApp" className="h-9 w-auto" />
        <Button variant="ghost" icon={<LogOut className="size-4" />} onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 leading-relaxed">
              <strong>Aviso temporal:</strong> Esta página de dashboard es provisoria. Próximamente el panel de repartidor se unificará como un apartado dentro del perfil de usuario normal, para mayor comodidad.
            </p>
          </div>
        </div>

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
          <div className="lg:col-span-1 space-y-5">
            <Card title="Tu perfil">
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-slate-400" />
                  {user.email}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  Cuenta activa
                </li>
                <li className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Star className="size-5 text-yellow-500 fill-current" />
                  <span className="font-medium text-slate-900">
                    {myRatings.length > 0 ? `${averageStars.toFixed(1)} de 5 estrellas` : 'Aún no tienes calificaciones'}
                  </span>
                </li>
              </ul>
            </Card>

            {/* Mis Postulaciones */}
            <Card title={<div className="flex items-center gap-2"><ClipboardList className="size-5 text-brand-600"/> Mis Postulaciones</div>}>
              {isLoadingApps ? (
                <Skeleton className="h-20 w-full" />
              ) : myApplications.length === 0 ? (
                <p className="text-sm text-slate-500">No has enviado ninguna postulación aún.</p>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((app: CourierApplication) => (
                    <div key={app.id} className="border border-slate-100 rounded-lg p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-slate-500">ID Vacante: {app.vacancy_id}</span>
                        {app.state_id === '2' ? <Badge tone="green">Aceptada</Badge> : 
                         app.state_id === '3' ? <Badge tone="red">Rechazada</Badge> : 
                         <Badge tone="gold">Pendiente</Badge>}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {app.delivery_vacancies?.description || 'Sin descripción disponible'}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">Postulaste el {formatDate(app.applied_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Vacantes disponibles en las columnas derecha */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="size-5 text-brand-600" />
              Oportunidades de Reparto
            </h2>

            {isLoadingVacancies || isLoadingApps ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : availableVacancies.length === 0 ? (
              <Card>
                <p className="py-8 text-center text-sm text-slate-500">
                  Por el momento no hay vacantes nuevas publicadas por las tiendas, o ya te postulaste a todas las disponibles.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {availableVacancies.map((vacancy: DeliveryVacancy) => (
                  <Card key={vacancy.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-900">
                          Vacante de entrega (Tienda ID: {vacancy.store_id})
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
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
                        className="shrink-0"
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
