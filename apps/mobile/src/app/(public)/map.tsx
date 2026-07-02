/**
 * Pestaña Mapa. Muestra los comercios geolocalizados sobre un mapa interactivo
 * (react-native-maps). Pide permiso de ubicación con expo-location y, si se
 * concede, centra el mapa en el usuario; si no, cae a un punto por defecto
 * (Santiago) y muestra un aviso. El mapa es libre: scroll, zoom y arrastre.
 *
 * Las tiendas llegan con `latitude`/`longitude` (pueden ser null si el dueño
 * aún no las geolocaliza); aquí solo se marcan las que sí tienen coordenadas.
 * Al pulsar un marcador se abre el detalle de tienda (/store/[id]).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Linking, Platform, LayoutAnimation, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { UrlTile } from 'react-native-maps';
import { AlertTriangle, Star, BadgeCheck, MapPin } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { RemoteImage } from '@/ui/RemoteImage';
import { colors } from '@/ui/theme';
import { useStores } from '@/features/stores/hooks';
import { StoreMarker } from '@/components/StoreMarker';
import type { Store } from '@/features/stores/types';

// Punto por defecto si el usuario no otorga permiso o la geolocalización falla.
const DEFAULT_REGION = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

type PermState = 'undetermined' | 'granted' | 'denied';

export default function MapScreen() {
  const router = useRouter();
  const { stores, loading, error, reload } = useStores({ limit: 200 });

  const [perm, setPerm] = useState<PermState>('undetermined');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [filterRegion, setFilterRegion] = useState(DEFAULT_REGION);
  const [locating, setLocating] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce: cuando el usuario termina de mover/hacer zoom (350ms), copia
  // `region` a `filterRegion`. Así el costoso useMemo de filtrado por viewport
  // solo corre al detener el gesto, no en cada frame intermedio.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRegionChangeComplete = useCallback((r: typeof DEFAULT_REGION) => {
    setRegion(r);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilterRegion(r), 350);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleMarkerPress = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedId(id);
  }, []);

  // Tap en zona vacía del mapa → vuelve a pantalla completa.
  const handleMapPress = useCallback(() => {
    if (selectedId !== null) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleGoToStore = useCallback(() => {
    if (selectedId) router.push(`/store/${selectedId}`);
  }, [router, selectedId]);

  // Al montar, pedir permiso y obtener la ubicación del usuario.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    (async () => {
      try {
        // Timeout de 10 segundos para no quedarse atascado
        timeoutId = setTimeout(() => {
          console.log('[MAP] Timeout de ubicación, mostrando mapa por defecto');
          setPerm('denied');
          setLocating(false);
        }, 10000);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPerm('denied');
          setLocating(false);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        setPerm('granted');
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const userRegion = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };
        setRegion(userRegion);
        setFilterRegion(userRegion);
        if (timeoutId) clearTimeout(timeoutId);
      } catch (err) {
        console.log('[MAP] Error de ubicación:', err);
        setPerm('denied');
        if (timeoutId) clearTimeout(timeoutId);
      } finally {
        setLocating(false);
      }
    })();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Solo las tiendas con coordenadas válidas (la API puede traer null).
  const geoStores: Store[] = useMemo(
    () =>
      stores.filter(
        (s) =>
          s.latitude != null &&
          !Number.isNaN(Number(s.latitude)) &&
          s.longitude != null &&
          !Number.isNaN(Number(s.longitude)),
      ),
    [stores],
  );

  // Filtra las tiendas geolocalizadas al bounding box del viewport actual.
  // Usa `filterRegion` (con debounce) para no recalcular en cada frame intermedio
  // del gesto. Solo recalcula ~350ms tras terminar de mover/zoom.
  const visibleStores: Store[] = useMemo(() => {
    const minLat = filterRegion.latitude - filterRegion.latitudeDelta / 2;
    const maxLat = filterRegion.latitude + filterRegion.latitudeDelta / 2;
    const minLng = filterRegion.longitude - filterRegion.longitudeDelta / 2;
    const maxLng = filterRegion.longitude + filterRegion.longitudeDelta / 2;
    return geoStores.filter((s) => {
      const lat = Number(s.latitude);
      const lng = Number(s.longitude);
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
  }, [geoStores, filterRegion]);

  // Tienda seleccionada (se muestra en panel inferior). Anima el cambio de tamaño.
  const selectedStore = useMemo(
    () => geoStores.find((s) => s.id === selectedId) ?? null,
    [geoStores, selectedId],
  );

  const rating = selectedStore ? Number(selectedStore.avg_rating) || 0 : 0;
  const meta = selectedStore
    ? [selectedStore.category_name, selectedStore.commune_city].filter(Boolean).join(' \u00b7 ')
    : '';

  // Abrir ajustes del sistema cuando se negó el permiso y el usuario quiere
  // habilitarlo manualmente.
  const openSettings = () => {
    void Linking.openSettings();
  };

  return (
    <Screen>
      {/* Título + subtítulo */}
      <View className="px-5 pb-3 pt-3">
        <Text variant="title">Mapa de tiendas</Text>
        <Text variant="caption" className="mt-1">
          Mueve y haz zoom sobre el mapa para explorar los comercios cercanos.
        </Text>
        <Text variant="caption" className="mt-1" style={{ color: colors.mutedForeground }}>
          {error
            ? 'Error al cargar tiendas'
            : loading
              ? 'Cargando tiendas...'
              : `${visibleStores.length} tiendas visibles de ${geoStores.length} con ubicación`}
        </Text>
        {error && (
          <View className="mt-2">
            <Button
              label="Reintentar"
              variant="secondary"
              onPress={reload}
            />
          </View>
        )}
      </View>

      <View className="mx-5 flex-1 overflow-hidden rounded-2xl border bg-card" style={{ borderColor: colors.border }}>
        {locating ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color={colors.brand[700]} />
            <Text variant="caption">Detectando tu ubicación…</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              initialRegion={region}
              onPress={handleMapPress}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={perm === 'granted'}
              showsMyLocationButton={perm === 'granted'}
              showsPointsOfInterest={false}
              showsBuildings={false}
              showsTraffic={false}
              mapType={Platform.OS === 'android' ? 'none' : 'standard'}
              style={{ flex: selectedStore ? 0.58 : 1 }}
            >
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              {visibleStores.map((s) => (
                <StoreMarker
                  key={s.id}
                  store={s}
                  selected={s.id === selectedId}
                  onPress={handleMarkerPress}
                />
              ))}
            </MapView>
            <View
              style={{
                position: 'absolute',
                bottom: 4,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.75)',
                borderRadius: 4,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <Text variant="caption" style={{ fontSize: 9, color: colors.mutedForeground }}>
                &copy; CARTO &copy; OpenStreetMap
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Panel inferior: info de la tienda seleccionada + botón Ver tienda */}
      {selectedStore && (
        <View className="mx-5 mt-3">
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <RemoteImage uri={selectedStore.logo_url} size={48} rounded={12} />
              <View style={{ flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text variant="subtitle" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {selectedStore.name}
                  </Text>
                  {selectedStore.verified ? (
                    <BadgeCheck size={15} color={colors.brand[500]} strokeWidth={2} />
                  ) : null}
                </View>
                {meta ? (
                  <Text variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>
                    <MapPin size={11} color={colors.mutedForeground} /> {meta}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Star size={13} color={colors.amber} fill={colors.amber} strokeWidth={0} />
                  <Text variant="caption" style={{ color: colors.foreground }}>
                    {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
                  </Text>
                  {selectedStore.review_count > 0 ? (
                    <Text variant="caption">· {selectedStore.review_count} reseñas</Text>
                  ) : null}
                </View>
              </View>
            </View>
            <View className="pt-3">
              <Button
                label="Ver tienda"
                onPress={handleGoToStore}
              />
            </View>
          </Card>
        </View>
      )}
      {perm === 'denied' && !locating && (
        <View className="mx-5 mt-3">
          <Card>
            <View className="flex-row items-center gap-3">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 40, height: 40, backgroundColor: colors.amber + '22' }}
              >
                <AlertTriangle size={20} color={colors.amber} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text variant="subtitle">Sin acceso a tu ubicación</Text>
                <Text variant="caption" className="mt-0.5">
                  Activamos el permiso para centrarte en el mapa. Las tiendas siguen visibles.
                </Text>
              </View>
            </View>
            <View className="pt-3">
              <Button label="Abrir ajustes" variant="secondary" onPress={openSettings} />
            </View>
          </Card>
        </View>
      )}

      {loading && (
        <View className="mt-3 flex-row items-center justify-center gap-2 pb-3">
          <ActivityIndicator size="small" color={colors.brand[700]} />
          <Text variant="caption">Cargando tiendas…</Text>
        </View>
      )}
    </Screen>
  );
}