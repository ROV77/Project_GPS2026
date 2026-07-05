import type { PublicStore, StoreVisualStatus } from '../types';

const STATUS_LABELS: Record<StoreVisualStatus, string> = {
  open: 'Abierto',
  closing_soon: 'Cierra pronto',
  closed: 'Cerrado',
};

export function getStoreStatusLabel(store: Pick<PublicStore, 'status'>): string {
  return STATUS_LABELS[store.status];
}

export function getStoreStatusTone(
  store: Pick<PublicStore, 'color'>,
): 'green' | 'gold' | 'red' {
  if (store.color === 'yellow') return 'gold';
  return store.color;
}
