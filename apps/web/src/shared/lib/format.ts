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

/** Iniciales (1–2 letras) a partir del nombre; '' si no hay nombre. */
export function getInitials(name?: string | null): string {
  if (!name?.trim()) return '';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
