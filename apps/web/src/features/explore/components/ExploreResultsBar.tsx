import { BadgeCheck, CircleDot, Store } from 'lucide-react';
import type { ExploreStoreStats } from '../lib/storeExploreStats';

interface ExploreResultsBarProps {
  stats: ExploreStoreStats;
  keyword?: string;
  categoryLabel?: string;
}

export function ExploreResultsBar({ stats, keyword, categoryLabel }: ExploreResultsBarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1 text-sm font-semibold text-white">
        <Store className="size-3.5" />
        {stats.total} {stats.total === 1 ? 'tienda' : 'tiendas'}
      </span>

      {stats.openNow > 0 ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-200/90">
          <CircleDot className="size-3.5 fill-emerald-400 text-emerald-400" />
          {stats.openNow} {stats.openNow === 1 ? 'abierta' : 'abiertas'} ahora
        </span>
      ) : null}

      {stats.verified > 0 ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-sky-200/90">
          <BadgeCheck className="size-3.5 text-sky-400" />
          {stats.verified} verificada{stats.verified === 1 ? '' : 's'}
        </span>
      ) : null}

      {keyword ? (
        <span className="inline-flex items-center rounded-full bg-amber-400/15 px-3 py-1 text-sm font-medium text-amber-200 ring-1 ring-amber-400/25">
          “{keyword}”
        </span>
      ) : null}

      {categoryLabel ? (
        <span className="inline-flex items-center rounded-full bg-brand-500/20 px-3 py-1 text-sm font-medium text-brand-100 ring-1 ring-brand-400/25">
          {categoryLabel}
        </span>
      ) : null}
    </div>
  );
}
