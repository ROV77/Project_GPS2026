import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Encabezado opcional de la tarjeta. */
  title?: ReactNode;
}

export function Card({ title, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {title && (
        <div className="border-b border-slate-100 px-5 py-3 font-medium text-slate-800">
          {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
