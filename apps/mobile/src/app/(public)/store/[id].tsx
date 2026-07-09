/**
 * Detalle de tienda: ficha (info + ubicación) + catálogo de productos.
 * Se abre con solo `id` en la URL, pero Home y el mapa además pasan el objeto
 * `Store` serializado por params para pintar la ficha al instante (ver
 * useStoreDetail). Los datos se refetchean desde:
 *   - GET /api/stores/:id           (ficha enriquecida)
 *   - GET /api/stores/:id/products  (catálogo público)
 */
import { useCallback, useMemo, useRef } from 'react';
import { View, Pressable, Linking, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  type SharedValue,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type BottomSheet from '@gorhom/bottom-sheet';
import { ChevronLeft, Star, BadgeCheck, MapPin, PackageOpen, ChevronRight, Tag } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { RemoteImage } from '@/ui/RemoteImage';
import { useThemeColors, colors as themeColors } from '@/ui/theme';
import { getCategoryStyle } from '@/features/stores/categoryStyle';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import { formatCLP } from '@/shared/lib/format';
import { useStoreDetail } from '@/features/stores/useStoreDetail';
import { useCart, cartCount, cartTotal } from '@/features/cart/cart.store';
import { ProductCard } from '@/components/ProductCard';
import { CartSheet } from '@/components/CartSheet';
import { FavoriteButton } from '@/components/FavoriteButton';
import type { Product, Store } from '@/features/stores/types';

export default function StoreDetailScreen() {
  const { id, store: storeParam } = useLocalSearchParams<{ id: string; store?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  // Hidratación instantánea: Home/mapa pasan el Store serializado por params.
  const initialStore = useMemo<Store | null>(() => {
    if (!storeParam) return null;
    try {
      return JSON.parse(storeParam) as Store;
    } catch {
      return null;
    }
  }, [storeParam]);

  const { store, products, loading, refreshing, error, reload, refresh } = useStoreDetail(id, initialStore);
  const cartRef = useRef<BottomSheet>(null);

  // Recargar (silencioso) al volver a enfocar la pantalla, para reflejar
  // promociones/stock creados después de la primera carga sin recargar la app.
  // Se salta el primer foco (la carga inicial ya la hace useStoreDetail).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refresh();
    }, [refresh]),
  );
  const itemCount = useCart((s) => (s.storeId === store?.id ? Object.keys(s.items).length : 0));
  const cartActive = itemCount > 0;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [100, 150], [0, 1], Extrapolation.CLAMP),
    };
  });

  return (
    <Screen>
      {/* Header pegajoso que aparece al hacer scroll */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: Math.max(insets.top + 60, 60),
            backgroundColor: colors.card,
            zIndex: 40,
            paddingTop: insets.top,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerOpacity,
        ]}
      >
        <Text variant="heading" numberOfLines={1} className="px-16 text-center text-xl">
          {store?.name}
        </Text>
      </Animated.View>

      {/* Botones flotantes (Volver y Favoritos) */}
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top + 8, 16),
          left: 16,
          right: 16,
          zIndex: 50,
          flexDirection: 'row',
          justifyContent: 'space-between',
          pointerEvents: 'box-none'
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="#FFF" />
        </Pressable>
        {store ? <FavoriteButton store={store} /> : null}
      </View>

      {store ? (
        <>
          <Animated.FlatList
            data={products}
            keyExtractor={(p: Product) => p.id}
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand[700]} />
            }
            ListHeaderComponent={
              <>
                <StoreHeader store={store} scrollY={scrollY} />
                {/* Promociones primero: lo primero visible del catálogo. */}
                <PromotionsSection products={products} store={store} />
                <View className="px-5 pb-2">
                  <Text variant="title" style={{ fontSize: 26, fontFamily: 'Inter_700Bold' }}>Catálogo</Text>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <View className="px-5 pb-3">
                <ProductCard product={item} store={store} />
              </View>
            )}
            ListEmptyComponent={loading ? <CatalogSkeleton /> : <CatalogEmpty />}
          />
          {cartActive && <OrderBar store={store} onPress={() => cartRef.current?.expand()} />}
          {cartActive && <CartSheet ref={cartRef} store={store} />}
        </>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <StoreHeaderSkeleton />
      )}
    </Screen>
  );
}

/** Barra inferior fija con el resumen del pedido. Se auto-oculta si el carrito
 *  no es de esta tienda o está vacío. Toca → abre el CartSheet. */
function OrderBar({ store, onPress }: { store: Store; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const count = useCart((s) => (s.storeId === store.id ? cartCount(s.items) : 0));
  const total = useCart((s) => (s.storeId === store.id ? cartTotal(s.items) : 0));
  if (count === 0) return null;

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-border bg-card px-5 pt-3"
      style={{ paddingBottom: insets.bottom || 12 }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Ver pedido"
        className="flex-row items-center justify-between rounded-lg bg-brand-700 px-4 py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <Text variant="subtitle" className="text-white">
          {count} {count === 1 ? 'producto' : 'productos'} · {formatCLP(total)}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text variant="label" className="text-white">
            Ver pedido
          </Text>
          <ChevronRight size={18} color={themeColors.white} strokeWidth={2.5} />
        </View>
      </Pressable>
    </View>
  );
}

/** Ficha superior: logo, nombre, categoría, rating, ubicación, descripción y CTA. */
function StoreHeader({ store, scrollY }: { store: Store; scrollY?: SharedValue<number> }) {
  const colors = useThemeColors();
  const router = useRouter();
  const style = getCategoryStyle(store.category_name);
  const rating = Number(store.avg_rating) || 0;
  const location = [store.commune_name, store.region_name].filter(Boolean).join(', ');
  const lat = Number(store.latitude);
  const lng = Number(store.longitude);
  const canNavigate = !Number.isNaN(lat) && !Number.isNaN(lng);

  const imageOpacity = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      opacity: interpolate(scrollY.value, [0, 150], [1, 0.3], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(scrollY.value, [-100, 0, 100], [-50, 0, 30], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const openDirections = () => {
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  // Lleva a la pestaña Mapa centrada en esta tienda (con su ficha abierta).
  const goToMap = () => {
    router.push({
      pathname: '/(public)/map',
      params: { focusId: store.id, focusLat: String(lat), focusLng: String(lng) },
    });
  };

  const whatsappUrl = buildWhatsAppUrl(
    store.store_phone,
    `Hola ${store.name}, te contacto desde Caserita 👋`,
  );

  return (
    <View className="mb-4">
      {/* Imagen destacada a todo el ancho con gradiente oscuro al fondo */}
      <Animated.View className="w-full bg-muted" style={[imageOpacity, { height: 300 }]}>
        {store.logo_url ? (
           <RemoteImage uri={store.logo_url} style={{ width: '100%', height: '100%' }} rounded={0} />
        ) : null}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 }}
        />
        
        {/* Textos informativos flotando en la mitad de arriba (sobre la foto) */}
        <View className="absolute bottom-6 left-0 right-0 px-6 items-center">
          <View className="flex-row items-center gap-2 justify-center">
            <Text numberOfLines={2} className="flex-shrink text-center" style={{ fontSize: 32, lineHeight: 36, fontFamily: 'Inter_700Bold', color: '#FFF' }}>
              {store.name}
            </Text>
            {store.verified ? (
              <BadgeCheck size={18} color={colors.brand[500]} strokeWidth={2} />
            ) : null}
          </View>

          <View className="mt-2 flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Star size={14} color={colors.amber} fill={colors.amber} strokeWidth={0} />
              <Text variant="caption" className="font-medium text-white">
                {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
              </Text>
              {store.review_count > 0 ? (
                <Text variant="caption" className="text-white/80">
                  ({store.review_count})
                </Text>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1">
              <style.Icon size={13} color="#FFF" strokeWidth={2.25} />
              <Text variant="caption" style={{ color: '#FFF' }}>
                {store.category_name ?? 'Tienda'}
              </Text>
            </View>
          </View>

          {location ? (
            <View className="mt-2 flex-row items-center justify-center gap-1.5">
              <MapPin size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              <Text variant="caption" className="text-center text-white/70">
                {location}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Recuadro blanco en la mitad de abajo (fuera de la foto) */}
      <View className="px-4 -mt-4">
        <View className="rounded-2xl bg-card p-4 shadow-sm border border-border items-center">
          {store.description ? (
            <Text variant="body" className="mb-4 text-sm text-foreground text-center">
              {store.description}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap justify-center gap-2">
            {canNavigate ? (
              <View className="flex-1 min-w-[45%]">
                <Button label="Mapa" variant="secondary" onPress={goToMap} />
              </View>
            ) : null}
            {canNavigate ? (
              <View className="flex-1 min-w-[45%]">
                <Button label="Cómo llegar" variant="secondary" onPress={openDirections} />
              </View>
            ) : null}
            {whatsappUrl ? (
              <View className="w-full mt-1">
                <Button label="Contactar" onPress={() => void Linking.openURL(whatsappUrl)} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Sección destacada con las promociones vigentes de la tienda. Va arriba del
 * catálogo (lo primero visible). Si no hay promos, no renderiza nada.
 */
function PromotionsSection({ products, store }: { products: Product[]; store: Store }) {
  const colors = useThemeColors();
  const promoted = products.filter((p) => (p.promotions?.length ?? 0) > 0);
  if (promoted.length === 0) return null;

  return (
    <View className="gap-3 px-5 pb-5">
      <View className="flex-row items-center gap-1.5">
        <Tag size={16} color={colors.amber} strokeWidth={2.25} />
        <Text variant="subtitle">Promociones</Text>
      </View>
      {promoted.map((p) => (
        <ProductCard key={p.id} product={p} store={store} />
      ))}
    </View>
  );
}

/** Skeletons del catálogo mientras carga (coherente con la Home). */
function CatalogSkeleton() {
  const colors = useThemeColors();
  return (
    <View className="gap-3 px-5">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="h-[92px] flex-row items-center gap-3">
          <View className="h-16 w-16 rounded-xl bg-muted" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-2/3 rounded bg-muted" />
            <View className="h-3 w-1/2 rounded bg-muted" />
            <View className="h-4 w-1/4 rounded bg-muted" />
          </View>
        </Card>
      ))}
    </View>
  );
}

function CatalogEmpty() {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 px-8 pt-8">
      <PackageOpen size={40} color={colors.mutedForeground} strokeWidth={1.5} />
      <Text variant="subtitle" className="text-center">
        Aún sin productos
      </Text>
      <Text variant="caption" className="text-center">
        Esta tienda todavía no publica productos en su catálogo.
      </Text>
    </View>
  );
}

/** Placeholder de la ficha cuando se entra por deep-link (sin params) y aún carga. */
function StoreHeaderSkeleton() {
  const colors = useThemeColors();
  return (
    <View className="gap-3 px-5 pt-2">
      <View className="flex-row items-center gap-3">
        <View className="h-[72px] w-[72px] rounded-2xl bg-muted" />
        <View className="flex-1 gap-2">
          <View className="h-5 w-2/3 rounded bg-muted" />
          <View className="h-3 w-1/3 rounded bg-muted" />
          <View className="h-4 w-10 rounded-md bg-muted" />
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>
      <View className="h-16 w-full rounded bg-muted" />
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { destructive } = useThemeColors();
  return (
    <View className="items-center gap-3 px-8 pt-16">
      <Text variant="subtitle" className="text-center">
        No pudimos cargar la tienda
      </Text>
      <Text variant="caption" className="text-center" style={{ color: destructive }}>
        Revisa tu conexión o que la API esté disponible.
      </Text>
      <View className="w-40 pt-2">
        <Button label="Reintentar" onPress={onRetry} variant="secondary" />
      </View>
    </View>
  );
}
