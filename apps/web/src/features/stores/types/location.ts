/** Ubicación unificada del comercio (buscador, mapa o GPS). */
export interface StoreLocation {
  lat: number;
  lng: number;
  /** Dirección completa compuesta (calle + número + contexto). */
  address: string;
  street: string;
  number: string;
  /** Nombre de región según Nominatim (p. ej. "Región del Biobío"). */
  regionName?: string;
  /** Nombre de comuna según Nominatim (p. ej. "Concepción"). */
  communeName?: string;
  /** false si el usuario editó la calle sin confirmar en mapa/buscador. */
  confirmed: boolean;
}

/** Resultado de búsqueda de direcciones (Nominatim). */
export interface AddressSuggestion {
  placeId: number;
  label: string;
  street: string;
  number: string;
  context: string;
  lat: number;
  lng: number;
  regionName?: string;
  communeName?: string;
}

/** Dirección parseada desde Nominatim. */
export interface ParsedAddress {
  street: string;
  number: string;
  context: string;
  full: string;
  regionName: string;
  communeName: string;
}
