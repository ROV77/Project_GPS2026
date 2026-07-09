import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Encabezado opcional de la tarjeta. */
  title?: ReactNode;
}

/** Tarjeta del panel. Superficie `card` con borde y sombra sutil. */
export function Card({ title, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-xs',
        className,
      )}
      {...props}
    >
      {title && (
        <div className="border-b border-border px-5 py-3 font-medium text-foreground">
          {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
