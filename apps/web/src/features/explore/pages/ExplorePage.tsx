import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Store, Smartphone, X } from 'lucide-react';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { ExploreSearchBar } from '../components/ExploreSearchBar';
import { ExploreCategoryChips } from '../components/ExploreCategoryChips';
import { ExploreResultsBar } from '../components/ExploreResultsBar';
import { PublicStoreCard } from '../components/PublicStoreCard';
import { DownloadAppPanel } from '../components/DownloadAppPanel';
import { ExplorePageShell } from '../components/ExplorePageShell';
import { filterStoresByKeyword } from '../lib/filterStores';
import {
  computeCategoryChips,
  filterStoresByCategory,
} from '../lib/filterStoresByCategory';
import { computeExploreStoreStats } from '../lib/storeExploreStats';
import { usePublicStores } from '../hooks/useExplore';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';

function buildSearchString(params: URLSearchParams): string {
  const next = new URLSearchParams();
  const q = params.get('q');
  const regionId = params.get('region_id');
  const communeId = params.get('commune_id');
  const categoryId = params.get('category_id');
  if (q) next.set('q', q);
  if (regionId) next.set('region_id', regionId);
  if (communeId) next.set('commune_id', communeId);
  if (categoryId) next.set('category_id', categoryId);
  return next.toString();
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlRegionId = searchParams.get('region_id');
  const urlCommuneId = searchParams.get('commune_id');
  const urlCategoryId = searchParams.get('category_id');

  const [keyword, setKeyword] = useState(urlQ);
  const [regionId, setRegionId] = useState<string | null>(urlRegionId);
  const [communeId, setCommuneId] = useState<string | null>(urlCommuneId);
  const [categoryId, setCategoryId] = useState<string | null>(urlCategoryId);

  const [bannerState, setBannerState] = useState<'visible' | 'fading' | 'hidden'>('visible');

  useEffect(() => {
    if (bannerState === 'visible') {
      const timer = setTimeout(() => setBannerState('fading'), 12000); // Inicia desvanecimiento en 12s
      return () => clearTimeout(timer);
    }
    if (bannerState === 'fading') {
      const timer = setTimeout(() => setBannerState('hidden'), 1000); // 1 segundo para desvanecerse
      return () => clearTimeout(timer);
    }
  }, [bannerState]);

  const categories = useCatalogOptions('categories');

  const apiParams = useMemo(
    () => ({
      region_id: urlRegionId ? Number(urlRegionId) : undefined,
      commune_id: urlCommuneId ? Number(urlCommuneId) : undefined,
    }),
    [urlRegionId, urlCommuneId],
  );

  const { data, isLoading, isError, refetch } = usePublicStores(apiParams);

  const baseStores = data?.data ?? [];

  const categoryChips = useMemo(
    () => computeCategoryChips(baseStores, categories.options),
    [baseStores, categories.options],
  );

  const stores = useMemo(() => {
    const byCategory = filterStoresByCategory(baseStores, urlCategoryId, categories.options);
    return filterStoresByKeyword(byCategory, urlQ);
  }, [baseStores, urlCategoryId, urlQ, categories.options]);

  const storeStats = useMemo(() => computeExploreStoreStats(stores), [stores]);

  const searchQueryString = buildSearchString(searchParams);

  const handleSubmit = () => {
    const next = new URLSearchParams();
    if (keyword.trim()) next.set('q', keyword.trim());
    if (regionId) next.set('region_id', regionId);
    if (communeId) next.set('commune_id', communeId);
    if (categoryId) next.set('category_id', categoryId);
    setSearchParams(next, { replace: true });
  };

  const handleCategorySelect = (nextCategoryId: string | null) => {
    setCategoryId(nextCategoryId);
    const next = new URLSearchParams(searchParams);
    if (nextCategoryId) next.set('category_id', nextCategoryId);
    else next.delete('category_id');
    setSearchParams(next, { replace: true });
  };

  const hasFilters = Boolean(urlQ || urlRegionId || urlCommuneId || urlCategoryId);
  const selectedCategoryLabel = urlCategoryId
    ? categories.options.find((o) => o.value === urlCategoryId)?.label
    : undefined;

  return (
    <ExplorePageShell>
      <LandingHeader />

      {bannerState !== 'hidden' && (
        <div className={cn(
          "sticky top-20 z-40 bg-brand-50 border-b border-brand-100 px-4 py-3 sm:px-6 lg:px-8 transition-opacity duration-1000 shadow-sm",
          bannerState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100',
          "animate-in slide-in-from-top-4 fade-in"
        )}>
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Smartphone className="size-4" />
              </div>
              <p className="text-sm font-medium text-brand-900">
                ¡Pide más rápido y chatea con los locales desde tu celular! <span className="font-semibold underline cursor-pointer hover:text-brand-700">Descarga la app de CaseritApp.</span>
              </p>
            </div>
            <button 
              onClick={() => setBannerState('fading')}
              className="shrink-0 rounded-lg p-1.5 text-brand-600 hover:bg-brand-100 transition"
              aria-label="Cerrar mensaje"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

        {/* Hero de ancho completo con borde festoneado (scalloped) mediante CSS Mask */}
        <section
          className="relative mb-8 w-full overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 pt-8 pb-14 shadow-lg"
          style={{
            WebkitMaskImage:
              'linear-gradient(black, black), radial-gradient(circle at 20px 20px, black 19.5px, transparent 20px)',
            WebkitMaskSize: '100% calc(100% - 20px), 40px 40px',
            WebkitMaskPosition: 'top, bottom',
            WebkitMaskRepeat: 'no-repeat, repeat-x',
            maskImage:
              'linear-gradient(black, black), radial-gradient(circle at 20px 20px, black 19.5px, transparent 20px)',
            maskSize: '100% calc(100% - 20px), 40px 40px',
            maskPosition: 'top, bottom',
            maskRepeat: 'no-repeat, repeat-x',
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-8 size-56 rounded-full bg-sky-400/15 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-8 md:px-12 lg:px-16">
            <div className="flex items-center gap-2 text-brand-200">
              <MapPin className="size-4" />
              <span className="text-sm font-medium">Comercios locales cerca de ti</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Explorar comercios
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/75 sm:text-base">
              Descubre tiendas de tu barrio. Para pedir y chatear, usa la app móvil.
            </p>

            <ExploreSearchBar
              keyword={keyword}
              onKeywordChange={setKeyword}
              regionId={regionId}
              onRegionChange={setRegionId}
              communeId={communeId}
              onCommuneChange={setCommuneId}
              onSubmit={handleSubmit}
              className="mt-6 shadow-xl ring-white/20"
            />
          </div>
        </section>

      <main className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 md:px-12 lg:px-16">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/60 bg-white/50 py-20 text-muted-foreground backdrop-blur-sm">
            <Loader2 className="size-5 animate-spin text-brand-600" />
            <span>Buscando tiendas…</span>
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="font-medium text-red-800">No pudimos cargar las tiendas</p>
            <p className="mt-1 text-sm text-red-600">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900"
            >
              Reintentar
            </button>
          </div>
        ) : baseStores.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-300/60 bg-white/50 px-6 py-16 text-center backdrop-blur-sm">
            <Store className="mb-3 size-10 text-brand-400" strokeWidth={1.5} />
            <p className="font-medium text-foreground">
              {hasFilters ? 'Sin resultados para tu búsqueda' : 'Aún no hay tiendas publicadas'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? 'Prueba otra palabra clave, categoría o amplía la zona de búsqueda.'
                : 'Cuando los comercios se registren, aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <>
            <ExploreCategoryChips
              totalCount={baseStores.length}
              chips={categoryChips}
              selectedId={urlCategoryId}
              onSelect={handleCategorySelect}
            />

            <ExploreResultsBar
              stats={storeStats}
              keyword={urlQ || undefined}
              categoryLabel={selectedCategoryLabel}
            />

            <div className="flex flex-col gap-12">
              {stores.length === 0 ? (
                <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 px-6 py-12 text-center">
                  <Store className="mb-3 size-8 text-slate-400" strokeWidth={1.5} />
                  <p className="font-medium text-slate-900">Ninguna tienda coincide con estos filtros</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Prueba otra categoría o quita la búsqueda por texto.
                  </p>
                </div>
              ) : (
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {stores.map((store) => (
                    <PublicStoreCard
                      key={store.id}
                      store={store}
                      searchQuery={searchQueryString}
                    />
                  ))}
                </div>
              )}
              <DownloadAppPanel />
            </div>
          </>
        )}
      </main>
    </ExplorePageShell>
  );
}
