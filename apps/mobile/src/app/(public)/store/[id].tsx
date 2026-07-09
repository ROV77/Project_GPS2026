/**
 * Detalle de tienda: ficha (info + ubicación) + catálogo de productos.
 * Se abre con solo `id` en la URL, pero Home y el mapa además pasan el objeto
 * `Store` serializado por params para pintar la ficha al instante (ver
 * useStoreDetail). Los datos se refetchean desde:
 *   - GET /api/stores/:id           (ficha enriquecida)
 *   - GET /api/stores/:id/products  (catálogo público)
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, Linking, RefreshControl, TextInput, Alert } from 'react-native';
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
import { Avatar } from '@/ui/Avatar';
import { useReviews } from '@/features/reviews/useReviews';
import { useSession } from '@/features/auth/session.store';
import type { Review } from '@/features/reviews/types';
import type { Product, Store } from '@/features/stores/types';

type Tab = 'productos' | 'resenas';

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
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('productos');
  const reviews = useReviews(id);

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
            data={tab === 'productos' ? products : reviews.reviews}
            keyExtractor={(item: Product | Review) => item.id}
            contentContainerStyle={{ paddingBottom: 96 }}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={tab === 'productos' ? refreshing : reviews.refreshing}
                onRefresh={tab === 'productos' ? refresh : reviews.refresh}
                tintColor={colors.brand[700]}
              />
            }
            ListHeaderComponent={
              <>
                <StoreHeader store={store} scrollY={scrollY} onPressRating={() => setTab('resenas')} />
                <TabBar tab={tab} onChange={setTab} reviewCount={store.review_count} />
                {tab === 'productos' ? (
                  <>
                    {/* Promociones primero: lo primero visible del catálogo. */}
                    <PromotionsSection products={products} store={store} />
                    <View className="px-5 pb-2">
                      <Text variant="title" style={{ fontSize: 26, fontFamily: 'Inter_700Bold' }}>Catálogo</Text>
                    </View>
                  </>
                ) : (
                  <ReviewForm onSubmit={reviews.submitReview} />
                )}
              </>
            }
            renderItem={({ item }) =>
              tab === 'productos' ? (
                <View className="px-5 pb-3">
                  <ProductCard product={item as Product} store={store} />
                </View>
              ) : (
                <View className="px-5 pb-3">
                  <ReviewCard review={item as Review} />
                </View>
              )
            }
            ListEmptyComponent={
              tab === 'productos'
                ? loading
                  ? <CatalogSkeleton />
                  : <CatalogEmpty />
                : reviews.loading
                  ? null
                  : <ReviewsEmpty />
            }
          />
          {cartActive && <OrderBar store={store} onPress={() => setCartOpen(true)} />}
          <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
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
function StoreHeader({ store, scrollY, onPressRating }: { store: Store; scrollY?: SharedValue<number>; onPressRating?: () => void }) {
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
            <Pressable 
              className="flex-row items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full"
              onPress={onPressRating}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Star size={14} color={colors.amber} fill={colors.amber} strokeWidth={0} />
              <Text variant="caption" className="font-medium text-white">
                {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
              </Text>
              {store.review_count > 0 ? (
                <Text variant="caption" className="text-white/80">
                  ({store.review_count})
                </Text>
              ) : null}
            </Pressable>
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

/** Selector de pestañas Productos / Reseñas dentro del detalle. */
function TabBar({ tab, onChange, reviewCount }: { tab: Tab; onChange: (t: Tab) => void; reviewCount?: number }) {
  return (
    <View className="flex-row gap-2 px-5 pb-4">
      <TabButton label="Productos" active={tab === 'productos'} onPress={() => onChange('productos')} />
      <TabButton
        label={reviewCount ? `Reseñas (${reviewCount})` : 'Reseñas'}
        active={tab === 'resenas'}
        onPress={() => onChange('resenas')}
      />
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-1 items-center rounded-full py-2.5 ${active ? 'bg-brand-700' : 'bg-muted'}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <Text variant="label" className={active ? 'text-white' : 'text-muted-foreground'}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Fila de 5 estrellas. Con `onPress` es editable (para calificar). */
function StarRow({ rating, size = 16, onPress }: { rating: number; size?: number; onPress?: (star: number) => void }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onPress?.(star)} disabled={!onPress} hitSlop={4}>
          <Star
            size={size}
            color={star <= rating ? colors.amber : colors.muted}
            fill={star <= rating ? colors.amber : 'transparent'}
            strokeWidth={star <= rating ? 0 : 2}
          />
        </Pressable>
      ))}
    </View>
  );
}

/** Formulario para publicar una reseña (o CTA de login si no hay sesión). */
function ReviewForm({ onSubmit }: { onSubmit: (input: { rating: number; comment: string }) => Promise<unknown> }) {
  const colors = useThemeColors();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status !== 'authenticated') {
    return (
      <View className="mx-5 mb-4 items-center rounded-2xl border border-border bg-card p-5">
        <Text variant="body" className="mb-3 text-center text-muted-foreground">
          Inicia sesión para calificar esta tienda y dejar tu opinión.
        </Text>
        <Button label="Iniciar sesión" variant="secondary" onPress={() => router.push('/login')} />
      </View>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      setComment('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="mx-5 mb-4 rounded-2xl border border-border bg-card p-5">
      <Text variant="body" className="mb-2 text-muted-foreground">
        ¿Cómo calificarías tu experiencia?
      </Text>
      <StarRow rating={rating} size={28} onPress={setRating} />
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Escribe tu opinión (opcional)"
        placeholderTextColor={colors.mutedForeground}
        multiline
        className="mt-4 min-h-[80px] rounded-xl border border-border bg-background p-3"
        style={{ color: colors.foreground, textAlignVertical: 'top' }}
      />
      <View className="mt-4">
        <Button label={submitting ? 'Enviando...' : 'Publicar reseña'} onPress={submit} loading={submitting} />
      </View>
    </View>
  );
}

/** Tarjeta de una reseña individual. */
function ReviewCard({ review }: { review: Review }) {
  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="mb-2 flex-row items-center gap-3">
        <Avatar uri={review.user.avatar_url} size={40} />
        <View className="flex-1">
          <Text variant="body" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {review.user.name || 'Usuario'}
          </Text>
          <StarRow rating={review.rating} size={14} />
        </View>
        <Text variant="label">{new Date(review.created_at).toLocaleDateString()}</Text>
      </View>
      {!!review.comment && (
        <Text variant="body" className="mt-1 text-muted-foreground">
          {review.comment}
        </Text>
      )}
    </View>
  );
}

function ReviewsEmpty() {
  return (
    <View className="items-center px-8 py-10">
      <Text variant="body" className="text-center text-muted-foreground">
        Aún no hay reseñas para esta tienda.
      </Text>
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
