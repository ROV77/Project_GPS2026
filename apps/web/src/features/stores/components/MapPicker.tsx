import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hash, Loader2, MapPin, Navigation, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/shared/ui';
import { cn } from '@/lib/utils';
import {
  buildFullAddress,
  getGeolocationErrorMessage,
  reverseGeocode,
  searchAddresses,
} from '../lib/geocoding';
import type { AddressSuggestion, StoreLocation } from '../types/location';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  /** Comuna seleccionada arriba; sesga la búsqueda de calle a esa zona. */
  communeName?: string | null;
  /** Región seleccionada arriba; complementa el sesgo de búsqueda. */
  regionName?: string | null;
  streetError?: string;
  onChange: (location: StoreLocation) => void;
}

const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 };
const SEARCH_DEBOUNCE_MS = 400;
const REVERSE_DEBOUNCE_MS = 600;

function areCoordsEqual(
  a: { lat: number; lng: number } | null | undefined,
  b: { lat: number; lng: number } | null | undefined,
): boolean {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

export function MapPicker({
  latitude,
  longitude,
  address,
  addressStreet,
  addressNumber,
  communeName,
  regionName,
  streetError,
  onChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const onChangeRef = useRef(onChange);
  const nearRef = useRef('');
  const suppressSearchRef = useRef(false);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const contextRef = useRef('');
  const streetNumberRef = useRef('');

  const [streetQuery, setStreetQuery] = useState(addressStreet ?? '');
  const [streetNumber, setStreetNumber] = useState(addressNumber ?? '');
  streetNumberRef.current = streetNumber;
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  onChangeRef.current = onChange;
  nearRef.current = [communeName, regionName].filter(Boolean).join(', ');

  const emitLocation = useCallback(
    (
      lat: number,
      lng: number,
      street: string,
      number: string,
      context: string,
      admin?: Pick<StoreLocation, 'regionName' | 'communeName'>,
    ) => {
      coordsRef.current = { lat, lng };
      contextRef.current = context;

      onChangeRef.current({
        lat,
        lng,
        street,
        number,
        address: buildFullAddress(street, number, context),
        regionName: admin?.regionName,
        communeName: admin?.communeName,
        confirmed: true,
      });
    },
    [],
  );

  const applyLocation = useCallback(
    (
      location: Omit<StoreLocation, 'address'> & { context?: string },
      options?: { preserveNumber?: boolean },
    ) => {
      suppressSearchRef.current = true;
      setStreetQuery(location.street);
      if (!options?.preserveNumber) {
        setStreetNumber(location.number);
      }

      const context = location.context ?? contextRef.current;
      contextRef.current = context;
      setSuggestions([]);
      setIsSearchOpen(false);
      setLocationError(null);

      emitLocation(
        location.lat,
        location.lng,
        location.street,
        options?.preserveNumber ? streetNumberRef.current : location.number,
        context,
        {
          regionName: location.regionName,
          communeName: location.communeName,
        },
      );

      if (mapRef.current && markerRef.current) {
        markerRef.current.setLatLng([location.lat, location.lng]);
        mapRef.current.setView([location.lat, location.lng], 16);
      }
    },
    [emitLocation],
  );

  const applyNumberChange = useCallback(
    (number: string) => {
      setStreetNumber(number);
      const coords =
        coordsRef.current ??
        (latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null);
      if (!coords) return;

      emitLocation(coords.lat, coords.lng, streetQuery, number, contextRef.current);
    },
    [emitLocation, latitude, longitude, streetQuery],
  );

  const resolveAddressForCoords = useCallback(
    (lat: number, lng: number) => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      reverseAbortRef.current?.abort();
      reverseAbortRef.current = new AbortController();

      reverseTimerRef.current = setTimeout(async () => {
        setIsReverseGeocoding(true);
        try {
          const parsed = await reverseGeocode(lat, lng, reverseAbortRef.current?.signal);
          applyLocation({
            lat,
            lng,
            street: parsed.street,
            number: parsed.number,
            context: parsed.context,
            regionName: parsed.regionName,
            communeName: parsed.communeName,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          applyLocation({
            lat,
            lng,
            street: streetQuery,
            number: '',
            context: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          });
        } finally {
          setIsReverseGeocoding(false);
        }
      }, REVERSE_DEBOUNCE_MS);
    },
    [applyLocation, streetQuery],
  );

  const handleCoordsChange = useCallback(
    (lat: number, lng: number) => {
      resolveAddressForCoords(lat, lng);
    },
    [resolveAddressForCoords],
  );

  useEffect(() => {
    if (latitude != null && longitude != null) {
      coordsRef.current = { lat: latitude, lng: longitude };
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!address?.trim() || !addressStreet?.trim()) return;
    const prefix = buildFullAddress(addressStreet, addressNumber ?? '');
    if (address.startsWith(prefix) && address.length > prefix.length + 2) {
      contextRef.current = address.slice(prefix.length + 2);
    }
  }, [address, addressStreet, addressNumber]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = latitude ?? DEFAULT_CENTER.lat;
    const initialLng = longitude ?? DEFAULT_CENTER.lng;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      handleCoordsChange(position.lat, position.lng);
    });

    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      handleCoordsChange(lat, lng);
    });

    return () => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [handleCoordsChange]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude == null || longitude == null) return;

    const current = markerRef.current.getLatLng();
    if (areCoordsEqual(current, { lat: latitude, lng: longitude })) return;

    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], 15);
  }, [latitude, longitude]);

  useEffect(() => {
    if (addressStreet != null && addressStreet !== streetQuery) {
      suppressSearchRef.current = true;
      setStreetQuery(addressStreet);
    }
  }, [addressStreet]);

  useEffect(() => {
    if (addressNumber != null && addressNumber !== streetNumber) {
      setStreetNumber(addressNumber);
    }
  }, [addressNumber]);

  useEffect(() => {
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false;
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchAbortRef.current?.abort();

    const trimmed = streetQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const results = await searchAddresses(trimmed, {
          signal: controller.signal,
          near: nearRef.current,
        });
        setSuggestions(results);
        setIsSearchOpen(results.length > 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSuggestions([]);
        setLocationError('No se pudieron cargar sugerencias de dirección.');
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchAbortRef.current?.abort();
    };
  }, [streetQuery]);

  useEffect(
    () => () => {
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      reverseAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    },
    [],
  );

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    applyLocation(
      {
        lat: suggestion.lat,
        lng: suggestion.lng,
        street: suggestion.street,
        number: streetNumber,
        context: suggestion.context,
        regionName: suggestion.regionName,
        communeName: suggestion.communeName,
      },
      { preserveNumber: true },
    );
  };

  const handleGetCurrentLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está soportada en este navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setIsLocating(false);
        handleCoordsChange(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        setLocationError(getGeolocationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  };

  const hasCoords = latitude != null && longitude != null;
  const isBusy = isSearching || isLocating || isReverseGeocoding;
  const previewAddress = address?.trim() || buildFullAddress(streetQuery, streetNumber, contextRef.current);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Ubicación geográfica</span>
        {(isBusy || hasCoords) && (
          <span className="text-xs text-muted-foreground">
            {isLocating
              ? 'Obteniendo GPS…'
              : isReverseGeocoding
                ? 'Resolviendo dirección…'
                : hasCoords
                  ? `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`
                  : null}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Calle</label>
          <Input
            value={streetQuery}
            onChange={(event) => {
              setStreetQuery(event.target.value);
              setLocationError(null);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsSearchOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setIsSearchOpen(false), 150);
            }}
            prefix={
              isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )
            }
            placeholder="Busca tu calle (ej: Lago Riñihue, Concepción)"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isSearchOpen}
            invalid={!!streetError}
          />
          {streetError && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {streetError}
            </p>
          )}

          {isSearchOpen && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg"
            >
              {suggestions.map((suggestion) => (
                <li key={suggestion.placeId} role="option">
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{suggestion.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Número</label>
          <Input
            value={streetNumber}
            onChange={(event) => applyNumberChange(event.target.value)}
            prefix={<Hash className="size-4" />}
            placeholder="Nº"
            className="placeholder:opacity-35"
            inputMode="text"
            autoComplete="off"
          />
        </div>
      </div>

      {previewAddress && (
        <p className="text-xs text-muted-foreground">
          Dirección: <span className="text-foreground">{previewAddress}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition',
            'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {isLocating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Navigation className="size-3.5" />
          )}
          Usar mi ubicación actual
        </button>
        <span className="text-xs text-muted-foreground">
          También puedes arrastrar el pin o hacer clic en el mapa.
        </span>
      </div>

      {locationError && (
        <p className="text-xs text-destructive" role="alert">
          {locationError}
        </p>
      )}

      <div
        ref={mapContainerRef}
        className="h-[300px] w-full rounded-lg border border-border z-10"
      />
    </div>
  );
}
