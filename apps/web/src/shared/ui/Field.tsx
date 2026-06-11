import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Envoltura de campo: etiqueta + control + mensaje de error. */
export function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
