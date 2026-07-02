import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

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
