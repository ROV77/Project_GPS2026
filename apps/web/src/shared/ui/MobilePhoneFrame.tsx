import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobilePhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Altura interior de la pantalla (px). */
  screenHeight?: number;
}

/** Marco de iPhone reutilizable para vistas previa y promos de la app. */
export function MobilePhoneFrame({
  children,
  className,
  screenHeight = 560,
}: MobilePhoneFrameProps) {
  return (
    <div className={cn('relative mx-auto w-[260px]', className)}>
      <div
        className="absolute -left-[3px] top-[100px] h-8 w-[3px] rounded-l-sm bg-slate-700"
        aria-hidden
      />
      <div
        className="absolute -left-[3px] top-[138px] h-12 w-[3px] rounded-l-sm bg-slate-700"
        aria-hidden
      />
      <div
        className="absolute -left-[3px] top-[192px] h-12 w-[3px] rounded-l-sm bg-slate-700"
        aria-hidden
      />
      <div
        className="absolute -right-[3px] top-[156px] h-16 w-[3px] rounded-r-sm bg-slate-700"
        aria-hidden
      />

      <div
        className="relative overflow-hidden rounded-[2.75rem] p-[11px] shadow-2xl ring-1 ring-black/30"
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

        <div
          className="relative flex flex-col overflow-hidden rounded-[2.1rem] bg-background"
          style={{ height: screenHeight }}
        >
          {children}
          <div className="flex shrink-0 justify-center bg-card pb-1.5 pt-0.5">
            <div className="h-1 w-24 rounded-full bg-slate-900/80" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
