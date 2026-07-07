import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  PackageOpen,
  Star,
} from 'lucide-react';
import { LandingHeader } from '@/features/landing/components/LandingHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/shared/lib/format';
import { CloudinaryImg } from '@/shared/ui/CloudinaryImg';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import type { StorePreviewData } from '@/features/stores/components/StoreMobilePreview';
import { DownloadAppPanel } from '../components/DownloadAppPanel';
import { ExplorePageShell } from '../components/ExplorePageShell';
import { PublicProductCard } from '../components/PublicProductCard';
import { getStoreStatusLabel, getStoreStatusTone } from '../lib/storeStatus';
import { usePublicStore, usePublicStoreProducts } from '../hooks/useExplore';

export function PublicStorePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const backHref =
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromSearch' in location.state &&
    typeof (location.state as { fromSearch?: string }).fromSearch === 'string'
      ? `/explorar${(location.state as { fromSearch: string }).fromSearch}`
      : '/explorar';

  const { data: store, isLoading, isError, refetch } = usePublicStore(id);
  const { data: products = [], isLoading: productsLoading } = usePublicStoreProducts(id);

  const rating = store ? Number(store.avg_rating) || 0 : 0;
  const locationLabel = store
    ? [store.commune_name, store.region_name].filter(Boolean).join(', ')
    : '';
  const lat = store ? Number(store.latitude) : NaN;
  const lng = store ? Number(store.longitude) : NaN;
  const canNavigate = !Number.isNaN(lat) && !Number.isNaN(lng);
  const whatsappUrl = store
    ? buildWhatsAppUrl(store.store_phone, `Hola ${store.name}, te contacto desde Caserita 👋`)
    : null;

  const previewData: StorePreviewData | undefined = store
    ? {
        name: store.name,
        description: store.description ?? '',
        categoryName: store.category_name ?? 'Tienda',
        logoUrl: store.logo_url,
        communeName: store.commune_name ?? undefined,
        regionName: store.region_name ?? undefined,
        verified: store.verified,
        avgRating: rating,
        reviewCount: store.review_count,
      }
    : undefined;

  return (
    <ExplorePageShell>
      <LandingHeader variant="brand" />

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <Link
          to={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a explorar
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Cargando tienda…</span>
          </div>
        ) : isError || !store ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="font-medium text-red-800">No pudimos cargar esta tienda</p>
            <p className="mt-1 text-sm text-red-600">Puede que no exista o la API no esté disponible.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-6">
              <section className="rounded-2xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur-sm">
                <div className="flex gap-4">
                  {store.logo_url ? (
                    <CloudinaryImg
                      src={store.logo_url}
                      alt=""
                      displayWidthPx={80}
                      className="size-20 shrink-0 rounded-2xl object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-semibold text-brand-700">
                      {getInitials(store.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold text-foreground sm:text-2xl">{store.name}</h1>
                      {store.verified ? (
                        <BadgeCheck className="size-5 text-brand-600" strokeWidth={2} />
                      ) : null}
                      <Badge tone={getStoreStatusTone(store)}>{getStoreStatusLabel(store)}</Badge>
                    </div>

                    {store.category_name ? (
                      <p className="mt-1 text-sm font-medium text-brand-700">{store.category_name}</p>
                    ) : null}

                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                      <span className="font-medium">{rating > 0 ? rating.toFixed(1) : 'Nuevo'}</span>
                      {store.review_count > 0 ? (
                        <span className="text-muted-foreground">· {store.review_count} reseñas</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {locationLabel ? (
                  <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0" />
                    <span>{locationLabel}</span>
                  </div>
                ) : null}

                {store.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-foreground">{store.description}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  {canNavigate ? (
                    <Button
                      variant="default"
                      icon={<Navigation className="size-4" />}
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                          '_blank',
                          'noopener,noreferrer',
                        )
                      }
                    >
                      Cómo llegar
                    </Button>
                  ) : null}
                  {whatsappUrl ? (
                    <Button
                      variant="primary"
                      icon={<MessageCircle className="size-4" />}
                      onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
                    >
                      WhatsApp
                    </Button>
                  ) : null}
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Catálogo</h2>

                {productsLoading ? (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Cargando productos…</span>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                    <PackageOpen className="mb-2 size-10 text-muted-foreground" strokeWidth={1.5} />
                    <p className="font-medium text-foreground">Aún sin productos</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esta tienda todavía no publica productos en su catálogo.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {products.map((product) => (
                      <PublicProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <DownloadAppPanel
              preview={previewData}
              title={`¿Quieres pedir en ${store.name}?`}
              subtitle="Catálogo, carrito y WhatsApp — todo en la app."
            />
          </div>
        )}
      </main>
    </ExplorePageShell>
  );
}
