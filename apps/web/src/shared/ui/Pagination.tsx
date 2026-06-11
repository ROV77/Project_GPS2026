import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

/** Controles de paginación server-side (page/pageSize/total). */
export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 20, 50, 100],
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
      <span>{total} en total</span>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s} / pág
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="default"
          disabled={page <= 1}
          onClick={() => onChange(page - 1, pageSize)}
          icon={<ChevronLeft className="size-4" />}
          aria-label="Página anterior"
        />
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="default"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1, pageSize)}
          icon={<ChevronRight className="size-4" />}
          aria-label="Página siguiente"
        />
      </div>
    </div>
  );
}
