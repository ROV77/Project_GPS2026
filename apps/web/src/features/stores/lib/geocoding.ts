import type { AddressSuggestion, ParsedAddress } from '../types/location';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimAddress {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

/** Compone la dirección completa a partir de calle, número y contexto geográfico. */
export function buildFullAddress(street: string, number: string, context?: string): string {
  const streetLine = [street.trim(), number.trim()].filter(Boolean).join(' ');
  const trimmedContext = context?.trim() ?? '';

  if (!streetLine) return trimmedContext;
  if (!trimmedContext) return streetLine;
  return `${streetLine}, ${trimmedContext}`;
}

function buildContextFromParts(parts: Array<string | undefined>): string {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }

  return unique.join(', ');
}

/** Extrae región y comuna administrativa desde la respuesta de Nominatim (Chile). */
export function extractChileAdminFromNominatim(address?: NominatimAddress): {
  regionName: string;
  communeName: string;
} {
  const regionName = address?.state?.trim() ?? '';
  const communeName =
    address?.city?.trim() ||
    address?.municipality?.trim() ||
    address?.town?.trim() ||
    address?.village?.trim() ||
    '';

  return { regionName, communeName };
}

/** Parsea la respuesta de Nominatim en calle, número y contexto. */
export function parseNominatimAddress(
  displayName: string,
  address?: NominatimAddress,
): ParsedAddress {
  const street = address?.road?.trim() || displayName.split(',')[0]?.trim() || '';
  const number = address?.house_number?.trim() ?? '';
  const { regionName, communeName } = extractChileAdminFromNominatim(address);
  const context = buildContextFromParts([
    address?.suburb,
    address?.neighbourhood,
    communeName || undefined,
    regionName || undefined,
    address?.postcode,
    address?.country,
  ]);

  const fallbackContext = displayName.split(',').slice(1).join(', ').trim();
  const full = buildFullAddress(street, number, context || fallbackContext);

  return { street, number, context, full, regionName, communeName };
}

async function nominatimFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${NOMINATIM_BASE}${path}`, {
    signal,
    headers: { Accept: 'application/json', 'Accept-Language': 'es' },
  });

  if (!res.ok) {
    throw new Error('No se pudo consultar el servicio de direcciones.');
  }

  return res.json() as Promise<T>;
}

/**
 * Busca calles y direcciones en Chile con autocompletado.
 * `near` agrega contexto (comuna/región) para sesgar los resultados a esa zona.
 */
export async function searchAddresses(
  query: string,
  opts?: { signal?: AbortSignal; near?: string },
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const near = opts?.near?.trim();
  const q = near ? `${trimmed}, ${near}` : trimmed;

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    countrycodes: 'cl',
    limit: '6',
  });

  const results = await nominatimFetch<NominatimSearchResult[]>(
    `/search?${params.toString()}`,
    opts?.signal,
  );

  return results.map((item) => {
    const parsed = parseNominatimAddress(item.display_name, item.address);
    return {
      placeId: item.place_id,
      label: item.display_name,
      street: parsed.street,
      context: parsed.context,
      lat: Number(item.lat),
      lng: Number(item.lon),
      regionName: parsed.regionName,
      communeName: parsed.communeName,
    };
  });
}

/** Geocodifica una comuna (+ región) a su centro aproximado, para centrar el mapa. */
export async function geocodeCommune(
  communeName: string,
  regionName?: string,
  signal?: AbortSignal,
): Promise<{ lat: number; lng: number } | null> {
  const q = [communeName, regionName, 'Chile'].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    q,
    format: 'json',
    countrycodes: 'cl',
    limit: '1',
  });

  const results = await nominatimFetch<NominatimSearchResult[]>(
    `/search?${params.toString()}`,
    signal,
  );

  const first = results[0];
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

/** Obtiene la dirección legible a partir de coordenadas. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ParsedAddress> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  });

  const result = await nominatimFetch<NominatimReverseResult>(
    `/reverse?${params.toString()}`,
    signal,
  );

  const displayName = result.display_name?.trim() ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  return parseNominatimAddress(displayName, result.address);
}

/** Mensaje legible para errores de geolocalización del navegador. */
export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Puedes buscar tu dirección manualmente.';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo determinar tu ubicación. Intenta de nuevo o busca manualmente.';
    case error.TIMEOUT:
      return 'La solicitud de ubicación tardó demasiado. Intenta de nuevo.';
    default:
      return 'No se pudo obtener tu ubicación actual.';
  }
}
