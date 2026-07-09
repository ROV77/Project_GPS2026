import type { PublicStore } from '../types';

export function getStoreStatusHint(
  store: Pick<PublicStore, 'status' | 'minutesUntilClose'>,
): string | null {
  if (store.status === 'closing_soon' && store.minutesUntilClose != null) {
    return `Cierra en ${store.minutesUntilClose} min`;
  }
  if (store.status === 'open') return 'Abierto ahora';
  return null;
}
