/**
 * "Mis favoritos": tiendas que el usuario marcó con el corazón. Lee el store de
 * favoritos (ya hidratado al iniciar sesión) y permite refrescar con pull-to-refresh.
 * Se llega desde la pestaña Cuenta; está oculta de la TabBar.
 */
import { useState } from 'react';
import { View, Pressable, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, HeartOff } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';
import { useThemeColors } from '@/ui/theme';
import { StoreCard } from '@/components/StoreCard';
import { useFavorites } from '@/features/favorites/favorites.store';
import type { Store } from '@/features/stores/types';

export default function FavoritesScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const stores = useFavorites((s) => s.stores);
  const status = useFavorites((s) => s.status);
  const hydrate = useFavorites((s) => s.hydrate);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  };

  const loading = status === 'loading' && stores.length === 0;

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-10 w-10 items-center justify-center rounded-full"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="heading">Mis favoritos</Text>
      </View>

      <FlatList
        data={loading ? [] : stores}
        keyExtractor={(s: Store) => s.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[700]} />
        }
        renderItem={({ item }) => (
          <View className="px-5 pb-3">
            <StoreCard
              store={item}
              onPress={() =>
                router.push({
                  pathname: '/(public)/store/[id]',
                  params: { id: item.id, store: JSON.stringify(item) },
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? <FavoritesSkeleton /> : status === 'error' ? (
            <ErrorState onRetry={hydrate} />
          ) : (
            <EmptyState onExplore={() => router.replace('/(public)')} />
          )
        }
      />
    </Screen>
  );
}

function FavoritesSkeleton() {
  return (
    <View className="gap-3 px-5 mt-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="h-[88px] flex-row items-center gap-3 border border-border">
          <Skeleton width={56} height={56} borderRadius={12} />
          <View className="flex-1 gap-2">
            <Skeleton width="66%" height={16} />
            <Skeleton width="33%" height={12} />
          </View>
        </Card>
      ))}
    </View>
  );
}

function EmptyState({ onExplore }: { onExplore: () => void }) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <HeartOff size={40} color={colors.mutedForeground} strokeWidth={1.5} />
      <Text variant="subtitle" className="text-center">
        Aún no tienes favoritos
      </Text>
      <Text variant="caption" className="text-center">
        Toca el corazón en una tienda para guardarla aquí.
      </Text>
      <View className="w-40 pt-3">
        <Button label="Explorar tiendas" onPress={onExplore} variant="secondary" />
      </View>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-3 px-8 pt-16">
      <Text variant="subtitle" className="text-center">
        No pudimos cargar tus favoritos
      </Text>
      <Text variant="caption" className="text-center" style={{ color: colors.destructive }}>
        Revisa tu conexión o que la API esté disponible.
      </Text>
      <View className="w-40 pt-2">
        <Button label="Reintentar" onPress={onRetry} variant="secondary" />
      </View>
    </View>
  );
}
