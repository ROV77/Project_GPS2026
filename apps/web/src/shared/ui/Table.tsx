import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  /** Render personalizado de la celda (recibe la fila completa). */
  render?: (row: T) => ReactNode;
  /** Campo a mostrar tal cual si no hay `render`. */
  dataIndex?: keyof T;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

/** Tabla genérica controlada por columnas. La paginación es aparte (ver Pagination). */
export function Table<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyText = 'Sin datos',
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn('px-4 py-3 font-medium', alignClass[c.align ?? 'left'])}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, r) => (
              <tr key={`skeleton-${r}`} className="border-b border-slate-100 last:border-0">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn('px-4 py-3', alignClass[c.align ?? 'left'])}
                  >
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn('px-4 py-3 text-slate-700', alignClass[c.align ?? 'left'])}
                  >
                    {c.render
                      ? c.render(row)
                      : c.dataIndex != null
                        ? String(row[c.dataIndex] ?? '')
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
