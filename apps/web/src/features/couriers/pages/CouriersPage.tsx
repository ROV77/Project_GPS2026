import { useMemo, useState } from 'react';
import { Briefcase, Star, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/shared/ui';
import { useMyStore } from '@/features/stores/hooks/useStores';
import { VacanciesTab } from '../components/VacanciesTab';
import { ApplicationsTab } from '../components/ApplicationsTab';
import { RatingsTab } from '../components/RatingsTab';
import { CourierStatsCards } from '../components/CourierStatsCards';
import {
  useVacancies,
  useApplications,
  useCourierRatings,
} from '../hooks/useCouriers';

type TabId = 'vacancies' | 'applications' | 'ratings';

const tabs = [
  { id: 'vacancies' as const, label: 'Publicaciones', icon: Briefcase },
  { id: 'applications' as const, label: 'Postulaciones', icon: UserCheck },
  { id: 'ratings' as const, label: 'Repartidores', icon: Star },
];

export function CouriersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('vacancies');
  const { data: myStore } = useMyStore();


  const { data: vacanciesData, isLoading: loadingVacancies } = useVacancies({
    page: 1,
    limit: 100,
    store_id: myStore?.id,
  });
  const { data: applicationsData, isLoading: loadingApps } = useApplications({
    page: 1,
    limit: 100,
    store_id: myStore?.id,
  });
  const { data: ratingsData, isLoading: loadingRatings } = useCourierRatings({
    page: 1,
    limit: 100,
    store_id: myStore?.id,
  });

  const stats = useMemo(() => {
    const apps = applicationsData?.data ?? [];
    const pending = apps.filter((a) => a.state_id !== '2' && a.state_id !== '3').length;
    const accepted = new Set(
      apps.filter((a) => a.state_id === '2').map((a) => String(a.courier_id)),
    ).size;
    const ratings = ratingsData?.data ?? [];
    const avgStars =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + Number(r.stars), 0) / ratings.length
        : 0;

    return {
      vacancies: vacanciesData?.total ?? vacanciesData?.data?.length ?? 0,
      pendingApplications: pending,
      acceptedCouriers: accepted,
      ratingsCount: ratings.length,
      avgStars,
    };
  }, [applicationsData, ratingsData, vacanciesData]);

  const tabCounts: Record<TabId, number | undefined> = {
    vacancies: stats.vacancies || undefined,
    applications: stats.pendingApplications || undefined,
    ratings: stats.ratingsCount || undefined,
  };

  const loadingStats = loadingVacancies || loadingApps || loadingRatings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repartidores"
        subtitle="Publica vacantes, revisa postulaciones y califica a quienes entregan por ti"
      />

      {loadingStats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-xl" />
          ))}
        </div>
      ) : (
        <CourierStatsCards
          vacancies={stats.vacancies}
          pendingApplications={stats.pendingApplications}
          acceptedCouriers={stats.acceptedCouriers}
          ratingsCount={stats.ratingsCount}
          avgStars={stats.avgStars}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const count = tabCounts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition',
                active
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100',
              )}
            >
              <Icon className="size-4" strokeWidth={2} />
              {label}
              {count != null && count > 0 ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-800',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'vacancies' && <VacanciesTab />}
        {activeTab === 'applications' && <ApplicationsTab />}
        {activeTab === 'ratings' && <RatingsTab />}
      </div>
    </div>
  );
}
