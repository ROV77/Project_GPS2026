/**
 * Pestaña Mapa. Muestra los comercios geolocalizados sobre un mapa interactivo
 * con clustering (react-native-map-clustering sobre react-native-maps + tiles
 * CARTO). Pide permiso de ubicación con expo-location y, si se concede, centra
 * el mapa en el usuario; si no, cae a un punto por defecto (Santiago).
 *
 * Los markers renderizan SIEMPRE todas las tiendas geolocalizadas que pasan el
 * filtro de búsqueda/categoría (el clustering absorbe el costo), así nunca
 * "desaparecen" al mover el mapa.
 *
 * Tocar un marker selecciona la tienda y abre StoreDetailSheet con su info —
 * es la ÚNICA forma de ver el detalle (sin carrusel: se quitó porque su
 * sincronía con el mapa —scrollToIndex → onViewableItemsChanged →
 * animateToRegion— causaba que, al tocar una tienda cerca de otra, el mapa
 * "rebotara" entre ambas antes de asentarse). Tocar el mapa vacío deselecciona
 * y cierra el sheet.
 *
 * El buscador + chips de categoría se colapsan (altura animada) mientras el
 * usuario arrastra el mapa (onPanDrag), y vuelven ~400ms después de soltar
 * (onRegionChangeComplete) — más espacio real para explorar sin estorbos.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Linking, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import ClusteredMapView from 'react-native-map-clustering';
import { UrlTile } from 'react-native-maps';
import type BottomSheet from '@gorhom/bottom-sheet';
import { AlertTriangle } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { colors } from '@/ui/theme';
import { useStores } from '@/features/stores/hooks';
import { StoreMarker } from '@/components/StoreMarker';
import { ClusterMarker } from '@/components/ClusterMarker';
import { StoreDetailSheet } from '@/components/StoreDetailSheet';
import { SearchBar } from '@/components/SearchBar';
import { CategoryChips, type Category } from '@/components/CategoryChips';
import type { Store } from '@/features/stores/types';

// Punto por defecto si el usuario no otorga permiso o la geolocalización falla.
const DEFAULT_REGION = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

// Altura del bloque SearchBar + CategoryChips (fija por diseño, ver componentes).
const FILTERS_HEIGHT = 108;

type PermState = 'undetermined' | 'granted' | 'denied';

export default function MapScreen() {
  // ponytail: carga total de tiendas de una vez; si algún día superan ~500,
  // crear endpoint nearby con bounding box en la API.
  const { stores, loading, error, reload } = useStores({ limit: 500 });

  const [perm, setPerm] = useState<PermState>('undetermined');
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locating, setLocating] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheet>(null);
  // react-native-map-clustering fija sus valores por defecto (mapRef,
  // clusteringEnabled, onMarkersChange, onClusterPress, superClusterRef) vía
  // `Component.defaultProps`, mecanismo que React 19 ya no soporta en
  // componentes de función/forwardRef. Sin pasarlos explícitos, quedan
  // `undefined`: `mapRef` revienta al montar/desmontar y `clusteringEnabled`
  // (falsy) desactiva el clustering en silencio. Se pasan todos a mano.
  const superClusterRef = useRef(null);
  const filtersHeight = useSharedValue(FILTERS_HEIGHT);

  const filtersStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    overflow: 'hidden',
  }));

  // Arrastrar el mapa colapsa el buscador/chips para dar más espacio.
  const handlePanDrag = useCallback(() => {
    filtersHeight.value = withTiming(0, { duration: 180 });
  }, [filtersHeight]);

  // Al soltar el gesto, el buscador/chips reaparecen tras una pausa breve.
  const handleRegionChangeComplete = useCallback(() => {
    filtersHeight.value = withDelay(400, withTiming(FILTERS_HEIGHT, { duration: 220 }));
  }, [filtersHeight]);

  // Tocar un marker selecciona la tienda y abre el sheet — sin mover el mapa
  // ni depender de ningún otro componente (evita el rebote del carrusel).
  const handleMarkerPress = useCallback((id: string) => {
    setSelectedId(id);
    sheetRef.current?.snapToIndex(1);
  }, []);

  // Tap en zona vacía del mapa → deselecciona y cierra el sheet.
  const handleMapPress = useCallback(() => {
    setSelectedId(null);
    sheetRef.current?.close();
  }, []);

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
        setRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        });
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

  // Categorías derivadas de las tiendas geolocalizadas (+ "Todos"), igual que Explorar.
  const categories = useMemo<Category[]>(() => {
    const names = Array.from(
      new Set(geoStores.map((s) => s.category_name).filter((n): n is string => !!n)),
    ).sort();
    return [{ id: null, name: 'Todos' }, ...names.map((n) => ({ id: n, name: n }))];
  }, [geoStores]);

  // Tiendas filtradas por búsqueda + categoría. Alimenta los markers.
  const filteredStores: Store[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return geoStores.filter((s) => {
      const byCat = !category || s.category_name === category;
      const byText = !q || s.name.toLowerCase().includes(q);
      return byCat && byText;
    });
  }, [geoStores, search, category]);

  const selectedStore = useMemo(
    () => geoStores.find((s) => s.id === selectedId) ?? null,
    [geoStores, selectedId],
  );

  // Abrir ajustes del sistema cuando se negó el permiso y el usuario quiere
  // habilitarlo manualmente.
  const openSettings = () => {
    void Linking.openSettings();
  };

  return (
    <Screen>
      {/* Título + estado de carga/error (siempre visible, no colapsa) */}
      <View className="px-5 pb-2 pt-3">
        <Text variant="title">Mapa de tiendas</Text>
        {error && (
          <>
            <Text variant="caption" className="mt-1" style={{ color: colors.destructive }}>
              Error al cargar tiendas
            </Text>
            <View className="mt-2">
              <Button label="Reintentar" variant="secondary" onPress={reload} />
            </View>
          </>
        )}
      </View>

      {/* Buscador + chips de categoría: se colapsan mientras se arrastra el mapa */}
      <Animated.View style={filtersStyle}>
        <View className="px-5 pb-3">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar tiendas en el mapa" />
        </View>
        <View className="pb-3">
          <CategoryChips categories={categories} selectedId={category} onSelect={setCategory} />
        </View>
      </Animated.View>

      <View className="mx-5 flex-1 overflow-hidden rounded-2xl border bg-card" style={{ borderColor: colors.border }}>
        {locating ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color={colors.brand[700]} />
            <Text variant="caption">Detectando tu ubicación…</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ClusteredMapView
              mapRef={() => {}}
              superClusterRef={superClusterRef}
              clusteringEnabled
              onMarkersChange={() => {}}
              onClusterPress={() => {}}
              // Burbuja de cluster propia (ver ClusterMarker.tsx): la del
              // ClusterMarker interno de la librería anida un halo
              // position:absolute que en Android (Fabric) a veces se
              // snapshotea a medio layout y sale recortado/glitcheado.
              renderCluster={(cluster) => (
                <ClusterMarker
                  key={`cluster-${cluster.id}`}
                  onPress={cluster.onPress}
                  geometry={cluster.geometry}
                  properties={cluster.properties}
                />
              )}
              initialRegion={region}
              onPress={handleMapPress}
              onPanDrag={handlePanDrag}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={perm === 'granted'}
              showsMyLocationButton={perm === 'granted'}
              showsPointsOfInterest={false}
              showsBuildings={false}
              showsTraffic={false}
              mapType={Platform.OS === 'android' ? 'none' : 'standard'}
              style={{ flex: 1 }}
              radius={60}
              minPoints={3}
              maxZoom={20}
              minZoom={1}
              extent={512}
              nodeSize={64}
              spiralEnabled={false}
              clusterColor={colors.brand[700]}
              clusterTextColor={colors.white}
              edgePadding={{ top: 50, left: 50, right: 50, bottom: 50 }}
            >
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              {filteredStores.map((s) => (
                <StoreMarker
                  key={s.id}
                  store={s}
                  coordinate={{ latitude: Number(s.latitude), longitude: Number(s.longitude) }}
                  selected={s.id === selectedId}
                  onPress={handleMarkerPress}
                />
              ))}
            </ClusteredMapView>
            <View
              style={{
                position: 'absolute',
                top: 6,
                left: 8,
                backgroundColor: 'rgba(255,255,255,0.85)',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text variant="caption" style={{ fontSize: 10, color: colors.mutedForeground }}>
                {loading ? 'Cargando…' : `${filteredStores.length} tiendas`}
              </Text>
            </View>
            <View
              style={{
                position: 'absolute',
                top: 6,
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

      <StoreDetailSheet ref={sheetRef} store={selectedStore} onClose={() => setSelectedId(null)} />
    </Screen>
  );
}
