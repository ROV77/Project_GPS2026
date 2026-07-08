/**
 * Mapa de tiendas basado en Leaflet dentro de un WebView (reemplazo de
 * react-native-maps, que en Android exige Google Play Services + API key de
 * Google Maps con facturación). Leaflet + Leaflet.markercluster son 100%
 * gratis, sin cuenta ni key, y corren dentro del WebView; como bonus, el mapa
 * funciona también en Expo Go.
 *
 * Replica lo que hacía el ClusteredMapView anterior:
 *  - tiles CARTO (misma URL),
 *  - un pin por tienda con ícono + color según rubro (getCategoryMarkerSvg),
 *  - clustering con burbuja numerada (tamaño creciente igual que antes),
 *  - tap en tienda / mapa vacío, flyTo programático, colapso de filtros al
 *    arrastrar.
 *
 * Puente RN ⇄ WebView:
 *  - web → RN: window.ReactNativeWebView.postMessage(JSON) → onMessage.
 *  - RN → web: ref.injectJavaScript('window.setStores(...);true;').
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors } from '@/ui/theme';
import { getCategoryMarkerSvg } from '@/features/stores/categoryStyle';
import type { Store } from '@/features/stores/types';
import { useColorScheme } from 'nativewind';

export interface LeafletMapHandle {
  flyTo: (lat: number, lng: number) => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  region: Region;
  stores: Store[];
  selectedId: string | null;
  /** Ubicación del usuario (si concedió permiso) para marcarla; null si no. */
  userLocation: { latitude: number; longitude: number } | null;
  onMarkerPress: (id: string) => void;
  onMapPress: () => void;
  onPanStart: () => void;
  onMoveEnd: () => void;
}

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  color: string;
  svg: string;
}

// Leaflet no usa latitudeDelta; se convierte a nivel de zoom aproximado.
function zoomFromDelta(latitudeDelta: number): number {
  return Math.round(Math.log2(360 / latitudeDelta));
}

// HTML del mapa. Estático salvo el centro/zoom inicial y los colores de marca;
// las tiendas se inyectan luego vía setStores (tras el handshake 'ready').
function buildHtml(region: Region, isDark: boolean): string {
  const zoom = zoomFromDelta(region.latitudeDelta);
  const brand = colors.brand[700];
  const brandDark = colors.brand[900];
  // El usuario solicitó mantener siempre el mapa en modo claro
  const bg = '#f8fafc';
  const tileUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  html, body, #map { margin: 0; height: 100%; width: 100%; background: ${bg}; transition: background 0.3s; }
  .leaflet-container { background: ${bg}; transition: background 0.3s; }
  /* Pin de tienda: círculo de color, borde blanco, sombra, ícono al centro. */
  .pin { width: 28px; height: 28px; border-radius: 14px; border: 2px solid #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3); display: flex; align-items: center;
    justify-content: center; box-sizing: border-box; }
  .pin svg { width: 14px; height: 14px; }
  .pin.sel { width: 34px; height: 34px; border-radius: 17px; border-color: ${brandDark}; }
  .pin.sel svg { width: 16px; height: 16px; }
  /* Burbuja de cluster: círculo de marca con el número. */
  .cl { border-radius: 50%; border: 2px solid #fff; background: ${brand};
    color: #fff; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.3); font-weight: 700; font-size: 13px;
    box-sizing: border-box; }
  /* Punto de ubicación del usuario. */
  .me { width: 16px; height: 16px; border-radius: 8px; background: #3f66a8;
    border: 3px solid #fff; box-shadow: 0 0 0 2px rgba(63,102,168,0.4); box-sizing: border-box; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var post = function (o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); };
  var map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([${region.latitude}, ${region.longitude}], ${zoom});
  var tileLayer = L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

  window.setTheme = function (dark) {
    // Mantenemos siempre el tileLayer claro según solicitud
    var newUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
    tileLayer.setUrl(newUrl);
    var bg = '#f8fafc';
    document.body.style.background = bg;
    document.getElementById('map').style.background = bg;
    var lc = document.querySelector('.leaflet-container');
    if (lc) lc.style.background = bg;
  };

  var sizeFor = function (n) { return n >= 25 ? 48 : n >= 10 ? 42 : n >= 4 ? 38 : 34; };
  var cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: false,
    maxClusterRadius: 60,
    iconCreateFunction: function (c) {
      var n = c.getChildCount(); var s = sizeFor(n);
      return L.divIcon({
        html: '<div class="cl" style="width:' + s + 'px;height:' + s + 'px">' + n + '</div>',
        className: '', iconSize: [s, s]
      });
    }
  });
  map.addLayer(cluster);

  var markers = {};   // id -> Leaflet marker
  var selectedId = null;
  var meMarker = null;

  var pinHtml = function (m, sel) {
    return '<div class="pin' + (sel ? ' sel' : '') + '" style="background:' + m.color + '">' + m.svg + '</div>';
  };
  var pinIcon = function (m, sel) {
    var d = sel ? 34 : 28;
    return L.divIcon({ html: pinHtml(m, sel), className: '', iconSize: [d, d], iconAnchor: [d / 2, d / 2] });
  };

  window.setStores = function (list) {
    cluster.clearLayers(); markers = {};
    list.forEach(function (m) {
      var mk = L.marker([m.lat, m.lng], { icon: pinIcon(m, m.id === selectedId) });
      mk._data = m;
      mk.on('click', function () { post({ t: 'marker', id: m.id }); });
      markers[m.id] = mk; cluster.addLayer(mk);
    });
  };

  window.setSelected = function (id) {
    var prev = selectedId; selectedId = id;
    [prev, id].forEach(function (k) {
      if (k && markers[k]) markers[k].setIcon(pinIcon(markers[k]._data, k === selectedId));
    });
  };

  window.setUser = function (lat, lng) {
    if (meMarker) { map.removeLayer(meMarker); meMarker = null; }
    if (lat == null || lng == null) return;
    meMarker = L.marker([lat, lng], {
      icon: L.divIcon({ html: '<div class="me"></div>', className: '', iconSize: [16, 16], iconAnchor: [8, 8] }),
      interactive: false, keyboard: false
    }).addTo(map);
  };

  window.flyTo = function (lat, lng) { map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 }); };

  // Tap en zona vacía (no sobre un marker) deselecciona.
  map.on('click', function () { post({ t: 'map' }); });
  // Arrastre del usuario colapsa filtros; cualquier asentamiento los devuelve.
  map.on('dragstart', function () { post({ t: 'panStart' }); });
  map.on('moveend', function () { post({ t: 'moveEnd' }); });

  post({ t: 'ready' });
</script>
</body>
</html>`;
}

export const LeafletMap = forwardRef<LeafletMapHandle, Props>(function LeafletMap(
  { region, stores, selectedId, userLocation, onMarkerPress, onMapPress, onPanStart, onMoveEnd },
  ref,
) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  // HTML se construye una sola vez con el centro inicial; después no se recrea
  // (recrearlo recargaría el WebView). Los updates van por inyección.
  const html = useMemo(() => buildHtml(region, isDark), []); // eslint-disable-line react-hooks/exhaustive-deps

  const markers = useMemo<MarkerData[]>(
    () =>
      stores.map((s) => {
        const { color, svg } = getCategoryMarkerSvg(s.category_name);
        return { id: s.id, lat: Number(s.latitude), lng: Number(s.longitude), color, svg };
      }),
    [stores],
  );

  const inject = useCallback((js: string) => {
    webRef.current?.injectJavaScript(`${js};true;`);
  }, []);

  const markersJson = useMemo(() => JSON.stringify(markers), [markers]);

  // Sincronizar cada porción de estado al WebView cuando cambia, pero solo una
  // vez que el mapa cargó (antes, el propio WebView lo pide con el 'ready').
  useEffect(() => {
    if (ready) inject(`window.setStores(${markersJson})`);
  }, [ready, markersJson, inject]);

  useEffect(() => {
    if (ready) inject(`window.setSelected(${JSON.stringify(selectedId)})`);
  }, [ready, selectedId, inject]);

  useEffect(() => {
    if (!ready) return;
    inject(
      userLocation
        ? `window.setUser(${userLocation.latitude},${userLocation.longitude})`
        : `window.setUser(null,null)`,
    );
  }, [ready, userLocation, inject]);

  useEffect(() => {
    if (ready) inject(`window.setTheme(${isDark})`);
  }, [ready, isDark, inject]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng) => inject(`window.flyTo(${lat},${lng})`),
  }));

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: { t: string; id?: string };
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      switch (msg.t) {
        case 'ready':
          // Al marcar ready, los useEffect de sincronización inyectan stores,
          // selección y ubicación actuales.
          setReady(true);
          break;
        case 'marker':
          if (msg.id) onMarkerPress(msg.id);
          break;
        case 'map':
          onMapPress();
          break;
        case 'panStart':
          onPanStart();
          break;
        case 'moveEnd':
          onMoveEnd();
          break;
      }
    },
    [onMarkerPress, onMapPress, onPanStart, onMoveEnd],
  );

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      originWhitelist={['*']}
      onMessage={onMessage}
      style={{ flex: 1, backgroundColor: colors.background }}
    />
  );
});
