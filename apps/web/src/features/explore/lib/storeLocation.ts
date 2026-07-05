import type { PublicStore } from '../types';

export function formatStoreLocation(
  store: Pick<PublicStore, 'commune_name' | 'commune_city' | 'region_name'>,
): string | null {
  const locality = store.commune_name ?? store.commune_city;
  const parts = [locality, store.region_name].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}
