export interface StoreAddressPreview {
  address?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  commune_name?: string | null;
  region_name?: string | null;
}

function streetLine(street?: string | null, number?: string | null): string {
  return [street?.trim(), number?.trim()].filter(Boolean).join(' ');
}

/** Dirección completa para la vista detalle (como en la app móvil). */
export function formatStoreAddress(store: StoreAddressPreview): string {
  const full = store.address?.trim();
  if (full) return full;

  const line = streetLine(store.address_street, store.address_number);
  const locality = [store.commune_name, store.region_name].filter(Boolean).join(', ');

  if (line && locality) return `${line}, ${locality}`;
  if (line) return line;
  return locality;
}

/** Línea corta para la tarjeta de lista. */
export function formatStoreAddressShort(store: StoreAddressPreview): string {
  const line = streetLine(store.address_street, store.address_number);
  if (line) return line;
  return store.commune_name?.trim() ?? '';
}
