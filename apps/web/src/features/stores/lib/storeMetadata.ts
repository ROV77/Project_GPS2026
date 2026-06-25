export interface StoreAddressMetadata {
  address: string;
  street: string;
  number: string;
}

/** Extrae calle, número y dirección completa desde stores.metadata. */
export function getStoreLocationMetadata(metadata: unknown): StoreAddressMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return { address: '', street: '', number: '' };
  }

  const record = metadata as Record<string, unknown>;
  const address = typeof record.address === 'string' ? record.address : '';
  const street = typeof record.street === 'string' ? record.street : '';
  const number = typeof record.number === 'string' ? record.number : '';

  if (street || number) {
    return { address, street, number };
  }

  // Compatibilidad con registros antiguos que solo guardaban `address`.
  return { address, street: address.split(',')[0]?.trim() ?? '', number: '' };
}

/** @deprecated Usa getStoreLocationMetadata */
export function getStoreAddress(metadata: unknown): string {
  return getStoreLocationMetadata(metadata).address;
}
