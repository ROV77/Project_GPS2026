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
import { View, ActivityIndicator, Linking, Pressable, Keyboard } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import type BottomSheet from '@gorhom/bottom-sheet';
import { AlertTriangle } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { colors } from '@/ui/theme';
import { useStores } from '@/features/stores/hooks';
import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';
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

  const params = useLocalSearchParams<{ focusId?: string; focusLat?: string; focusLng?: string }>();
  const sheetRef = useRef<BottomSheet>(null);
  // Handle imperativo del mapa Leaflet (WebView): expone flyTo. Ver LeafletMap.tsx.
  const mapViewRef = useRef<LeafletMapHandle>(null);
  // Último focusId procesado (viene del detalle de tienda) para no repetir.
  const handledFocus = useRef<string | null>(null);
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

  // Centrar el mapa en una tienda + seleccionarla y abrir su ficha (igual que
  // tocar su marker). Cierra el desplegable del buscador.
  const focusStore = useCallback((store: Store) => {
    const latitude = Number(store.latitude);
    const longitude = Number(store.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;
    mapViewRef.current?.flyTo(latitude, longitude);
    setSelectedId(store.id);
    sheetRef.current?.snapToIndex(1);
    Keyboard.dismiss();
    setSearch('');
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

  // Resultados del buscador para el desplegable (solo con texto). Reutiliza el
  // filtrado existente; cap a 8 filas.
  const searchMatches = useMemo(
    () => (search.trim() ? filteredStores.slice(0, 8) : []),
    [search, filteredStores],
  );

  // Foco entrante desde el detalle de tienda ("Ver en el mapa"): cuando llega un
  // focusId nuevo y la tienda ya cargó, centra el mapa y abre su ficha.
  useEffect(() => {
    const focusId = params.focusId;
    if (!focusId || locating || handledFocus.current === focusId) return;
    const target = geoStores.find((s) => s.id === focusId);
    if (!target) return; // aún no cargan las tiendas; reintenta al actualizarse geoStores
    handledFocus.current = focusId;
    const t = setTimeout(() => focusStore(target), 350);
    return () => clearTimeout(t);
  }, [params.focusId, locating, geoStores, focusStore]);

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

      {/* Buscador + chips de categoría: se colapsan mientras se arrastra el mapa.
          El desplegable de resultados va fuera del área que colapsa (overflow) y
          se posiciona bajo el buscador. */}
      <View style={{ zIndex: 20 }}>
        <Animated.View style={filtersStyle}>
          <View className="px-5 pb-3">
            <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar tiendas en el mapa" />
          </View>
          <View className="pb-3">
            <CategoryChips categories={categories} selectedId={category} onSelect={setCategory} />
          </View>
        </Animated.View>

        {searchMatches.length > 0 && (
          <View style={{ position: 'absolute', top: 54, left: 20, right: 20, zIndex: 30 }}>
            <Card elevated className="p-0 overflow-hidden">
              {searchMatches.map((s, i) => {
                const meta = [s.category_name, s.commune_name].filter(Boolean).join(' · ');
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => focusStore(s)}
                    className="px-4 py-3 active:bg-muted"
                    style={i > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : undefined}
                  >
                    <Text variant="body" numberOfLines={1}>{s.name}</Text>
                    {meta ? <Text variant="caption" numberOfLines={1}>{meta}</Text> : null}
                  </Pressable>
                );
              })}
            </Card>
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
            <LeafletMap
              ref={mapViewRef}
              region={region}
              stores={filteredStores}
              selectedId={selectedId}
              userLocation={
                perm === 'granted'
                  ? { latitude: region.latitude, longitude: region.longitude }
                  : null
              }
              onMarkerPress={handleMarkerPress}
              onMapPress={handleMapPress}
              onPanStart={handlePanDrag}
              onMoveEnd={handleRegionChangeComplete}
            />
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
