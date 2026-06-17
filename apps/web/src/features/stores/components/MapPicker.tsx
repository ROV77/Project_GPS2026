import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregir el bug de los íconos de Leaflet en Vite/React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 }; // Santiago, Chile

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = latitude != null ? latitude : DEFAULT_CENTER.lat;
    const initialLng = longitude != null ? longitude : DEFAULT_CENTER.lng;

    // Inicializar mapa
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
    mapRef.current = map;

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Agregar marcador inicial
    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Evento al arrastrar el marcador
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange({ lat: position.lat, lng: position.lng });
    });

    // Evento al hacer clic en el mapa
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ lat, lng });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Actualizar mapa si cambian las coordenadas externamente (por ejemplo, al resetear el formulario)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude == null || longitude == null) return;

    const currentLatLng = markerRef.current.getLatLng();
    if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 16);
          onChange({ lat, lng });
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('No se pudo obtener tu ubicación actual.');
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Ubicación Geográfica
        </span>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold rounded-md border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
        >
          Usar mi ubicación actual
        </button>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[300px] w-full rounded-lg border border-gray-300 dark:border-gray-700 z-10"
      />

      {latitude != null && longitude != null && (
        <p className="text-xs text-gray-500">
          Coordenadas seleccionadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
