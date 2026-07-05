import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/format';
import { EXPLORE_CARD_HEIGHT } from '../lib/exploreLayout';
import { getCategoryCardStyle } from '../lib/categoryStyle';
import { formatStoreLocation } from '../lib/storeLocation';
import { getStoreStatusLabel, getStoreStatusTone } from '../lib/storeStatus';
import { getStoreStatusHint } from '../lib/storeStatusHint';
import type { PublicStore } from '../types';

interface PublicStoreCardProps {
  store: PublicStore;
  searchQuery?: string;
}

export function PublicStoreCard({ store, searchQuery = '' }: PublicStoreCardProps) {
  const rating = Number(store.avg_rating) || 0;
  const backSearch = searchQuery ? `?${searchQuery}` : '';
  const style = getCategoryCardStyle(store.category_name);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(store.logo_url?.trim()) && !logoFailed;
  const location = formatStoreLocation(store);
  const statusHint = getStoreStatusHint(store);
  const description = store.description?.trim();

  return (
    <Link
      to={`/tienda/${store.id}`}
      state={{ fromSearch: backSearch }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-slate-600/50 bg-slate-800/95 shadow-md backdrop-blur-sm transition hover:border-slate-500/70 hover:bg-slate-800 hover:shadow-lg',
        EXPLORE_CARD_HEIGHT,
        style.border,
      )}
    >
      <div className="relative h-28 shrink-0 overflow-hidden">
        {showLogo ? (
          <>
            <img
              src={store.logo_url!}
              alt=""
              className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105"
              onError={() => setLogoFailed(true)}
            />
            <div className="absolute inset-0 bg-slate-900/35" aria-hidden />
          </>
        ) : (
          <div className={cn('flex h-full items-center justify-center', style.header)}>
            <div className="flex size-16 items-center justify-center rounded-xl bg-black/20 text-xl font-semibold text-white/90 ring-1 ring-white/15">
              {getInitials(store.name)}
            </div>
          </div>
        )}
        <Badge
          tone={getStoreStatusTone(store)}
          className="absolute right-2 top-2 z-10 shadow-sm"
        >
          {getStoreStatusLabel(store)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start gap-1.5">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-slate-50 group-hover:text-white">
            {store.name}
          </h3>
          {store.verified ? (
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-sky-400" strokeWidth={2} />
          ) : null}
        </div>

        {store.category_name ? (
          <span
            className={cn(
              'mt-1.5 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium',
              style.pill,
            )}
          >
            {store.category_name}
          </span>
        ) : null}

        {description ? (
          <p className="mt-1.5 line-clamp-1 text-xs text-slate-400">{description}</p>
        ) : null}

        {location ? (
          <p className="mt-1 flex items-center gap-1 line-clamp-1 text-xs text-slate-500">
            <MapPin className="size-3 shrink-0 text-slate-500" />
            {location}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-2 text-xs">
          {statusHint ? (
            <span
              className={cn(
                'font-medium',
                store.status === 'open' ? 'text-emerald-400' : 'text-amber-400',
              )}
            >
              {statusHint}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
            <span className="font-medium text-slate-200">
              {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
            </span>
            {store.review_count > 0 ? (
              <span className="text-slate-500">· {store.review_count} reseñas</span>
            ) : null}
          </span>
        </div>
      </div>
    </Link>
  );
}
