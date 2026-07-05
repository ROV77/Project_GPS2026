import { Briefcase, Clock, Star, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourierStatsCardsProps {
  vacancies: number;
  pendingApplications: number;
  acceptedCouriers: number;
  ratingsCount: number;
  avgStars: number;
  className?: string;
}

const items = [
  {
    key: 'vacancies',
    label: 'Vacantes activas',
    icon: Briefcase,
    tone: 'text-brand-700 bg-brand-50',
    format: (s: CourierStatsCardsProps) => String(s.vacancies),
  },
  {
    key: 'pending',
    label: 'Postulaciones pendientes',
    icon: Clock,
    tone: 'text-amber-700 bg-amber-50',
    format: (s: CourierStatsCardsProps) => String(s.pendingApplications),
  },
  {
    key: 'accepted',
    label: 'Repartidores aceptados',
    icon: UserCheck,
    tone: 'text-emerald-700 bg-emerald-50',
    format: (s: CourierStatsCardsProps) => String(s.acceptedCouriers),
  },
  {
    key: 'ratings',
    label: 'Promedio calificaciones',
    icon: Star,
    tone: 'text-violet-700 bg-violet-50',
    format: (s: CourierStatsCardsProps) =>
      s.ratingsCount > 0 ? `${s.avgStars.toFixed(1)} ★` : '—',
  },
] as const;

export function CourierStatsCards(props: CourierStatsCardsProps) {
  const { className, ratingsCount } = props;

  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>
      {items.map(({ key, label, icon: Icon, tone, format }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs"
        >
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tone)}>
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{format(props)}</p>
            <p className="text-xs text-muted-foreground">
              {key === 'ratings' && ratingsCount > 0 ? `${ratingsCount} en total · ${label}` : label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
