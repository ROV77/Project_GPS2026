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
    <div className={cn('relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50', className)}>
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
