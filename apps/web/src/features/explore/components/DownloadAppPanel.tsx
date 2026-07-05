import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobilePhoneFrame } from '@/shared/ui/MobilePhoneFrame';
import {
  StoreAppPreviewContent,
  type StorePreviewData,
} from '@/features/stores/components/StoreMobilePreview';
import { AppStoreBadgeButton, GooglePlayBadgeButton } from './StoreBadgeButtons';

export const DOWNLOAD_APP_DEFAULT_PREVIEW: StorePreviewData = {
  name: 'Panadería El Horno',
  description: '',
  categoryName: 'Panadería',
  communeName: 'Tu comuna',
  regionName: 'Tu región',
  verified: true,
  avgRating: 4.8,
  reviewCount: 12,
};

interface DownloadAppPanelProps {
  preview?: StorePreviewData;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function DownloadAppPanel({
  preview = DOWNLOAD_APP_DEFAULT_PREVIEW,
  className,
  title = 'Pide desde tu celular',
  subtitle = 'Catálogo, carrito y WhatsApp — todo en la app.',
}: DownloadAppPanelProps) {
  return (
    <aside
      className={cn(
        'w-full shrink-0 xl:w-[300px] xl:sticky xl:top-24 xl:self-start',
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 px-5 py-5 shadow-xl ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-amber-400/20 blur-2xl"
          aria-hidden
        />

        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
            <Sparkles className="size-3" />
            Próximamente
          </span>

          <div>
            <h2 className="text-xl font-bold leading-snug text-white">{title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/70">{subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 px-1">
            <AppStoreBadgeButton />
            <GooglePlayBadgeButton />
          </div>

          {/* Mockup inferior — recortado como en el diseño de referencia */}
          <div className="relative -mx-5 -mb-5 mt-2 h-[210px] overflow-hidden">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom scale-[0.62]">
              <MobilePhoneFrame screenHeight={380} className="w-[240px] drop-shadow-2xl">
                <StoreAppPreviewContent data={preview} />
              </MobilePhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
