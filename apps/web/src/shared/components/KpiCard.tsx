import type { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/shared/ui';

/**
 * Tarjeta de KPI para el dashboard. La tendencia es opcional y solo visual. Hoy
 * se alimenta de datos mock; cuando exista el endpoint de analytics, basta
 * cambiar la fuente de `value`/`trend`.
 */
export function KpiCard({
  title,
  value,
  icon,
  suffix,
  trend,
}: {
  title: string;
  value: number | string;
  icon?: ReactNode;
  suffix?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {value}
            {suffix && <span className="ml-1 text-base font-normal text-slate-500">{suffix}</span>}
          </p>
        </div>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      {trend && (
        <p
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            trend.positive ? 'text-green-600' : 'text-red-600',
          )}
        >
          {trend.positive ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {trend.value}% vs semana anterior
        </p>
      )}
    </Card>
  );
}
