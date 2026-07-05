import { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Compass,
  Map as MapIcon,
  MapPin,
  Search,
  Smartphone,
  Star,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/format';
import { formatStoreAddressShort } from '../lib/formatStoreAddress';

export interface StorePreviewData {
  name: string;
  description: string;
  categoryName: string;
  logoUrl?: string | null;
  address?: string;
  addressStreet?: string;
  addressNumber?: string;
  communeName?: string;
  regionName?: string;
  latitude?: number | null;
  longitude?: number | null;
  /** En la vista previa refleja el plan (Pro/Premium = verificado). */
  verified?: boolean;
  avgRating?: number;
  reviewCount?: number;
}

interface StoreMobilePreviewProps {
  data: StorePreviewData;
  className?: string;
}

const SAMPLE_CHIPS = ['Todos', 'Almacén', 'Botillería', 'Carnicería'];

function formatLocationHeader(commune?: string, region?: string): string {
  if (commune && region) {
    const shortRegion = region.replace(/^Región (del |de la |de )?/i, '').trim();
    return `${commune}, ${shortRegion}`;
  }
  if (commune) return commune;
  return 'Tu comuna';
}

function PreviewLogo({
  logoUrl,
  name,
  size = 56,
  rounded = 12,
}: {
  logoUrl?: string | null;
  name: string;
  size?: number;
  rounded?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name) || '?';
  const showImage = logoUrl?.trim() && !failed;

  if (showImage) {
    return (
      <img
        src={logoUrl!}
        alt=""
        className="shrink-0 object-cover bg-muted"
        style={{ width: size, height: size, borderRadius: rounded }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center bg-brand-700 text-sm font-semibold text-white"
      style={{ width: size, height: size, borderRadius: rounded }}
    >
      {initials}
    </div>
  );
}

function HomeHeader({ locationLabel }: { locationLabel: string }) {
  return (
    <>
      <div className="flex items-center justify-between px-3.5 pb-1 pt-0.5">
        <span className="text-[15px] font-bold text-brand-700">Caserita</span>
        <div className="flex items-center gap-1">
          <MapPin className="size-3 text-muted-foreground" strokeWidth={2} />
          <span className="max-w-[120px] truncate text-[10px] text-muted-foreground">
            {locationLabel}
          </span>
        </div>
      </div>
      <div className="px-3.5 pb-2.5 pt-1">
        <p className="text-[15px] font-bold leading-tight text-foreground">Descubre los comercios</p>
        <p className="text-[15px] font-bold leading-tight text-foreground">de tu barrio</p>
      </div>
    </>
  );
}

function SearchBarMock() {
  return (
    <div className="mx-3.5 flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2.5">
      <Search className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      <span className="text-[11px] text-muted-foreground">Buscar tiendas</span>
    </div>
  );
}

function CategoryChipsMock({ activeCategory }: { activeCategory: string }) {
  const chips = useMemo(() => {
    const names = new Set(SAMPLE_CHIPS);
    if (activeCategory) names.add(activeCategory);
    return Array.from(names);
  }, [activeCategory]);

  return (
    <div className="flex gap-1.5 overflow-x-auto px-3.5 pb-2.5 pt-2.5 [scrollbar-width:none]">
      {chips.map((name) => {
        const active = name === 'Todos';
        return (
          <span
            key={name}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium',
              active ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700',
            )}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

function ListCardPreview({ data, highlighted }: { data: StorePreviewData; highlighted?: boolean }) {
  const addressShort = formatStoreAddressShort({
    address_street: data.addressStreet,
    address_number: data.addressNumber,
    commune_name: data.communeName,
  });
  const meta = [data.categoryName, addressShort || data.communeName].filter(Boolean).join(' · ');
  const rating = data.avgRating ?? 0;
  const displayName = data.name.trim() || 'Nombre de tu tienda';

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl border bg-card p-2.5',
        highlighted ? 'border-brand-700/30 ring-2 ring-brand-700/20' : 'border-border opacity-45',
      )}
    >
      <PreviewLogo logoUrl={data.logoUrl} name={displayName} size={44} rounded={10} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-[12px] font-semibold text-foreground">{displayName}</p>
          {data.verified ? (
            <BadgeCheck className="size-3.5 shrink-0 text-brand-500" strokeWidth={2} />
          ) : null}
        </div>
        {meta ? (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{meta}</p>
        ) : null}
        <div className="mt-1 flex items-center gap-1">
          <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={0} />
          <span className="text-[10px] text-foreground">
            {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
          </span>
          {(data.reviewCount ?? 0) > 0 ? (
            <span className="text-[10px] text-muted-foreground">· {data.reviewCount} reseñas</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GhostStoreCard() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 opacity-35">
      <div className="size-11 shrink-0 rounded-xl bg-muted" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded bg-muted" />
        <div className="h-2 w-1/2 rounded bg-muted" />
        <div className="h-2 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}

function TabBarMock() {
  const tabs = [
    { label: 'Explorar', Icon: Compass, active: true },
    { label: 'Mapa', Icon: MapIcon, active: false },
    { label: 'Cuenta', Icon: User, active: false, badge: true },
  ] as const;

  return (
    <div className="shrink-0 border-t border-border bg-card px-2 pb-0.5 pt-1.5">
      <div className="flex">
        {tabs.map(({ label, Icon, active, badge }) => (
          <div key={label} className="relative flex flex-1 flex-col items-center gap-0.5 py-0.5">
            <div className="relative">
              <Icon
                className={cn('size-[18px]', active ? 'text-brand-700' : 'text-muted-foreground')}
                strokeWidth={active ? 2.25 : 2}
              />
              {badge ? (
                <span className="absolute -right-2 -top-1 flex size-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">
                  !
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                'text-[9px] font-medium',
                active ? 'text-brand-700' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex shrink-0 items-center justify-between bg-background px-5 pb-1.5 pt-2">
      <span className="text-[10px] font-semibold tabular-nums text-foreground">9:41</span>
      <div
        className="absolute left-1/2 top-1.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-slate-950"
        aria-hidden
      />
      <div className="flex items-center gap-1">
        <svg width="14" height="9" viewBox="0 0 16 10" className="text-foreground" aria-hidden>
          <rect x="0" y="6" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="4.5" y="4" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="9" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="20" height="9" viewBox="0 0 22 10" className="text-foreground" aria-hidden>
          <rect x="0.5" y="0.5" width="18" height="9" rx="2" fill="none" stroke="currentColor" />
          <rect x="2" y="2" width="13" height="6" rx="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export function StoreMobilePreview({ data, className }: StoreMobilePreviewProps) {
  const locationLabel = formatLocationHeader(data.communeName, data.regionName);

  return (
    <aside className={cn('w-[280px] shrink-0', className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Smartphone className="size-4" />
        Vista previa en la app
      </div>

      <div className="relative">
        <div
          className="absolute -left-[3px] top-[108px] h-8 w-[3px] rounded-l-sm bg-slate-700"
          aria-hidden
        />
        <div
          className="absolute -left-[3px] top-[148px] h-12 w-[3px] rounded-l-sm bg-slate-700"
          aria-hidden
        />
        <div
          className="absolute -left-[3px] top-[204px] h-12 w-[3px] rounded-l-sm bg-slate-700"
          aria-hidden
        />
        <div
          className="absolute -right-[3px] top-[168px] h-16 w-[3px] rounded-r-sm bg-slate-700"
          aria-hidden
        />

        <div
          className="relative overflow-hidden rounded-[2.75rem] p-[11px] shadow-2xl ring-1 ring-black/20"
          style={{
            background: 'linear-gradient(145deg, #3d3d3d 0%, #1a1a1a 40%, #0a0a0a 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[2.75rem] opacity-30"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%)',
            }}
            aria-hidden
          />

          <div className="relative flex h-[600px] flex-col overflow-hidden rounded-[2.1rem] bg-background">
            <StatusBar />

            {/* Pantalla Home — Explorar */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
                <HomeHeader locationLabel={locationLabel} />
                <SearchBarMock />
                <CategoryChipsMock activeCategory={data.categoryName} />

                <p className="px-3.5 pb-2 pt-0.5 text-[12px] font-semibold text-foreground">
                  Cerca de ti
                </p>

                <div className="space-y-2 px-3.5 pb-3">
                  <ListCardPreview data={data} highlighted />
                  <GhostStoreCard />
                  <GhostStoreCard />
                </div>
              </div>

              <TabBarMock />
            </div>

            <div className="flex shrink-0 justify-center bg-card pb-1.5 pt-0.5">
              <div className="h-1 w-24 rounded-full bg-slate-900/80" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-left text-xs text-muted-foreground">
        Así verán tu tienda en Explorar
      </p>
    </aside>
  );
}
