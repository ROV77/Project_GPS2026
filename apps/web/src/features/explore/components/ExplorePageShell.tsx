import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/features/landing/components/PublicFooter';

interface ExplorePageShellProps {
  children: ReactNode;
  className?: string;
}

/** Fondo con tonos de marca para páginas públicas de exploración. */
export function ExplorePageShell({ children, className }: ExplorePageShellProps) {
  return (
    <div className={cn('relative flex min-h-screen flex-col overflow-x-hidden', className)}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-500 via-brand-800/35 to-slate-600"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -left-32 top-20 -z-10 size-[420px] rounded-full bg-brand-600/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-24 top-1/3 -z-10 size-[380px] rounded-full bg-amber-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-1/3 -z-10 size-[360px] rounded-full bg-brand-700/20 blur-3xl"
        aria-hidden
      />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
