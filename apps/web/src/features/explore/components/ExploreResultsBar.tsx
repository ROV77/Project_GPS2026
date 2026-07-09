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
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
          <CircleDot className="size-3.5 fill-emerald-500 text-emerald-500" />
          {stats.openNow} {stats.openNow === 1 ? 'abierta' : 'abiertas'} ahora
        </span>
      ) : null}

      {stats.verified > 0 ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-sky-700">
          <BadgeCheck className="size-3.5 text-sky-500" />
          {stats.verified} verificada{stats.verified === 1 ? '' : 's'}
        </span>
      ) : null}

      {keyword ? (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          “{keyword}”
        </span>
      ) : null}

      {categoryLabel ? (
        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {categoryLabel}
        </span>
      ) : null}
    </div>
  );
}
