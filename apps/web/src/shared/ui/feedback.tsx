import type { ReactNode } from 'react';
import { Loader2, Inbox } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/** Bloque "esqueleto" para estados de carga. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-slate-200', className)} />;
}

/** Spinner de carga reutilizable. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-slate-400', className)} />;
}

/** Estado vacío para listas o paneles sin datos. */
export function EmptyState({
  description,
  icon,
  className,
}: {
  description: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-10 text-slate-400',
        className,
      )}
    >
      {icon ?? <Inbox className="size-10" />}
      <p className="text-sm">{description}</p>
    </div>
  );
}
