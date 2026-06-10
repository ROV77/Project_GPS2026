import type { ReactNode } from 'react';
import { Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

type AlertType = 'info' | 'success' | 'warning' | 'error';

const styles: Record<AlertType, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const icons: Record<AlertType, ReactNode> = {
  info: <Info className="size-5 shrink-0" />,
  success: <CircleCheck className="size-5 shrink-0" />,
  warning: <TriangleAlert className="size-5 shrink-0" />,
  error: <CircleX className="size-5 shrink-0" />,
};

/** Aviso en caja con ícono y variantes info/success/warning/error. */
export function Alert({
  type = 'info',
  title,
  description,
  className,
}: {
  type?: AlertType;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3 text-sm', styles[type], className)}>
      {icons[type]}
      <div>
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="opacity-90">{description}</p>}
      </div>
    </div>
  );
}
