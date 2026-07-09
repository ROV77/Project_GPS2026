/**
 * Formateo de valores para la UI. `formatCLP` presenta precios en pesos chilenos
 * (sin decimales, separador de miles con punto): 12000 → "$12.000". Acepta el
 * `price` tal cual llega de la API (string por el Decimal serializado, o number).
 */
export function formatCLP(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '$0';
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}
