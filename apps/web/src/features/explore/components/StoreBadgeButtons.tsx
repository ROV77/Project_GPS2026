import { cn } from '@/lib/utils';

interface StoreBadgeButtonProps {
  className?: string;
}

/** Badge estilo App Store (negro, icono Apple). */
export function AppStoreBadgeButton({ className }: StoreBadgeButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-label="Descargar en App Store — Próximamente"
      className={cn(
        'relative flex items-center gap-2 rounded-lg bg-black px-2.5 py-2.5',
        'ring-1 ring-white/15 disabled:cursor-default',
        className,
      )}
    >
      <AppleIcon className="size-6 shrink-0 text-white" />
      <div className="min-w-0 text-left">
        <p className="text-[8px] leading-none text-white/60">Descárgala en</p>
        <p className="text-[11px] font-semibold leading-tight text-white">App Store</p>
      </div>
      <span className="absolute -right-0.5 -top-0.5 rounded bg-amber-400 px-1 py-px text-[7px] font-bold uppercase text-amber-950">
        Pronto
      </span>
    </button>
  );
}

/** Badge estilo Google Play (negro, icono play). */
export function GooglePlayBadgeButton({ className }: StoreBadgeButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-label="Disponible en Google Play — Próximamente"
      className={cn(
        'relative flex items-center gap-2 rounded-lg bg-black px-2.5 py-2.5',
        'ring-1 ring-white/15 disabled:cursor-default',
        className,
      )}
    >
      <GooglePlayIcon className="size-6 shrink-0" />
      <div className="min-w-0 text-left">
        <p className="text-[8px] leading-none text-white/60">Disponible en</p>
        <p className="text-[11px] font-semibold leading-tight text-white">Google Play</p>
      </div>
      <span className="absolute -right-0.5 -top-0.5 rounded bg-amber-400 px-1 py-px text-[7px] font-bold uppercase text-amber-950">
        Pronto
      </span>
    </button>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EA4335" d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" />
      <path fill="#FBBC04" d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" />
      <path fill="#4285F4" d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" />
      <path fill="#34A853" d="M6.05 2.66L16.81 8.88L14.54 11.15L3.84 2.15C4.34 1.91 4.86 1.91 6.05 2.66Z" />
    </svg>
  );
}
