/** Formateadores de presentación, centralizados para consistencia en todo el panel. */

/** Pesos chilenos sin decimales: 1800 → "$1.800". Acepta el Decimal de la API (number o string). */
export function formatCLP(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}

/** Fecha ISO → "09-06-2026". Devuelve "—" si viene vacía o inválida. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CL');
}
