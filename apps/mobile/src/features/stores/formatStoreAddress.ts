import type { Store } from './types';

type StoreAddressFields = Pick<
  Store,
  'address' | 'address_street' | 'address_number' | 'commune_name' | 'region_name'
>;

function streetLine(street: string | null | undefined, number: string | null | undefined): string {
  return [street?.trim(), number?.trim()].filter(Boolean).join(' ');
}

/** Dirección completa para mostrar al cliente (calle + número + comuna). */
export function formatStoreAddress(store: StoreAddressFields): string {
  const full = store.address?.trim();
  if (full) return full;

  const line = streetLine(store.address_street, store.address_number);
  const locality = [store.commune_name, store.region_name].filter(Boolean).join(', ');

  if (line && locality) return `${line}, ${locality}`;
  if (line) return line;
  return locality;
}

/** Línea corta para listados (calle + número, o comuna). */
export function formatStoreAddressShort(store: StoreAddressFields): string {
  const line = streetLine(store.address_street, store.address_number);
  if (line) return line;
  return store.commune_name?.trim() ?? '';
}
