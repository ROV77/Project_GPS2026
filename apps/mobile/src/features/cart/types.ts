/**
 * Tipos del dominio "carrito". El carrito es ficticio (no hay pasarela de pago):
 * su único propósito es armar un pedido y enviarlo por WhatsApp a la tienda.
 */
import type { Product } from '@/features/stores/types';

export interface CartItem {
  product: Product;
  qty: number;
}
