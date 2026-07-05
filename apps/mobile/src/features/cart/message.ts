/**
 * Arma el texto del pedido para enviarlo por WhatsApp. Vive en el feature (no en
 * shared/lib) porque conoce el tipo `CartItem`. El enlace wa.me se construye
 * aparte con buildWhatsAppUrl (shared/lib/whatsapp.ts).
 *
 * Ejemplo:
 *   Hola Panadería La Esquina, quiero hacer un pedido desde Caserita 🛒
 *
 *   • 2× Marraqueta — $3.600
 *   • 1× Hallulla — $1.700
 *
 *   Total: $5.300
 */
import { formatCLP } from '@/shared/lib/format';
import type { CartItem } from './types';

export function buildOrderMessage(storeName: string, items: CartItem[]): string {
  const lines = items.map(
    (it) => `• ${it.qty}× ${it.product.name} — ${formatCLP(it.qty * Number(it.product.price))}`,
  );
  const total = items.reduce((n, it) => n + it.qty * Number(it.product.price), 0);
  return [
    `Hola ${storeName}, quiero hacer un pedido desde Caserita 🛒`,
    '',
    ...lines,
    '',
    `Total: ${formatCLP(total)}`,
  ].join('\n');
}
