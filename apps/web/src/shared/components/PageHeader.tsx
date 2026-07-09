import type { ReactNode } from 'react';

/** Encabezado estándar de cada página: título, subtítulo opcional y acciones a la derecha. */
export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {extra}
    </div>
  );
}
