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
    <div className={cn('w-full', className)}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-slate-950 px-6 py-6 shadow-xl sm:px-10 md:flex md:items-center md:justify-between md:py-8">
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-64 rounded-full bg-amber-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 space-y-5 md:max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
            <Sparkles className="size-3.5" />
            Próximamente
          </span>

          <div>
            <h2 className="text-2xl font-bold leading-snug text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">{subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="w-32"><AppStoreBadgeButton /></div>
            <div className="w-32"><GooglePlayBadgeButton /></div>
          </div>
        </div>

        {/* Mockup inferior/derecho */}
        <div className="relative -mx-8 -mb-6 mt-6 h-[160px] overflow-hidden md:mx-0 md:-my-8 md:mt-0 md:h-[220px] md:w-[280px] md:shrink-0">
          <div className="absolute bottom-0 left-1/2 origin-bottom -translate-x-1/2 scale-[0.5] md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:origin-right md:-translate-y-1/2 md:translate-x-0 md:scale-[0.6]">
            <MobilePhoneFrame screenHeight={380} className="w-[240px] drop-shadow-2xl">
              <StoreAppPreviewContent data={preview} />
            </MobilePhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
