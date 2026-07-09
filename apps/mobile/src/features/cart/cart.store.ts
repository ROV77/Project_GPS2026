/**
 * Carrito ficticio (zustand). Sigue el patrón de features/auth/session.store.ts.
 *
 * Reglas de negocio:
 *  - El pedido se envía por WhatsApp a UNA tienda, así que el carrito pertenece a
 *    una sola tienda a la vez. Agregar un producto de otra tienda REEMPLAZA el
 *    carrito (la UI confirma con un Alert antes, ver ProductCard).
 *  - Guarda la referencia de la tienda (id/nombre/teléfono) para poder armar el
 *    mensaje aunque el usuario navegue fuera del detalle (el carrito persiste en
 *    memoria mientras la app siga abierta).
 *
 * Accesible fuera de React con `useCart.getState()` (lo usa el guard cross-store).
 */
import { create } from 'zustand';
import type { Product, Store } from '@/features/stores/types';
import type { CartItem } from './types';

/** Datos mínimos de la tienda dueña del carrito (para el mensaje de WhatsApp). */
type CartStoreRef = Pick<Store, 'id' | 'name' | 'store_phone'>;

interface CartState {
  storeId: string | null;
  storeName: string | null;
  storePhone: string | null;
  items: Record<string, CartItem>; // keyed by product.id
  addItem: (store: CartStoreRef, product: Product) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const EMPTY = {
  storeId: null,
  storeName: null,
  storePhone: null,
  items: {} as Record<string, CartItem>,
};

/** Limita la cantidad al stock disponible del producto (definido en el panel web). */
export function capCartQty(product: Product, qty: number): number {
  const max = Math.max(0, product.stock);
  return Math.min(Math.max(0, qty), max);
}

export const useCart = create<CartState>((set, get) => ({
  ...EMPTY,

  addItem: (store, product) => {
    if (product.stock <= 0) return;
    const { storeId, items } = get();
    // Carrito de una tienda a la vez: si cambia de tienda, se reemplaza.
    const base = storeId === store.id ? items : {};
    const prevQty = base[product.id]?.qty ?? 0;
    const nextQty = capCartQty(product, prevQty + 1);
    if (nextQty <= prevQty) return;
    set({
      storeId: store.id,
      storeName: store.name,
      storePhone: store.store_phone,
      items: { ...base, [product.id]: { product, qty: nextQty } },
    });
  },

  increment: (productId) => {
    const item = get().items[productId];
    if (!item) return;
    get().setQty(productId, item.qty + 1);
  },
  decrement: (productId) => get().setQty(productId, (get().items[productId]?.qty ?? 0) - 1),

  setQty: (productId, qty) => {
    const { items } = get();
    const item = items[productId];
    if (!item) return;
    const clamped = capCartQty(item.product, qty);
    const next = { ...items };
    if (clamped <= 0) delete next[productId];
    else next[productId] = { ...item, qty: clamped };
    // Si el carrito queda vacío, limpiamos también la referencia de tienda.
    if (Object.keys(next).length === 0) set({ ...EMPTY });
    else set({ items: next });
  },

  clear: () => set({ ...EMPTY }),
}));

/** Nº total de unidades en el carrito. */
export function cartCount(items: Record<string, CartItem>): number {
  return Object.values(items).reduce((n, it) => n + it.qty, 0);
}

/** Total en pesos del carrito. */
export function cartTotal(items: Record<string, CartItem>): number {
  return Object.values(items).reduce((n, it) => n + it.qty * Number(it.product.price), 0);
}
