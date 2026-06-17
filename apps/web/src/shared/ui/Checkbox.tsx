import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Checkbox con etiqueta. onChange entrega el booleano. */
export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700', className)}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-4 rounded-sm border-slate-300 accent-brand-700 focus:ring-brand-500"
      />
      {children}
    </label>
  );
}
