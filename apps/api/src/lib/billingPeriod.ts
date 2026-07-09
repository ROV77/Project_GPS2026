import { HttpError } from './httpError';

/**
 * Suma un período de facturación a una fecha (para calcular expires_at de una
 * suscripción recién activada). Hoy los planes solo usan 'monthly'.
 */
export function addBillingPeriod(from: Date, billingPeriod: string): Date {
  const result = new Date(from);
  switch (billingPeriod) {
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      return result;
    default:
      throw new HttpError(500, `Periodo de facturación no soportado: ${billingPeriod}`);
  }
}
