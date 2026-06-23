/**
 * PRIMERA PANTALLA — Home "Descubre los comercios de tu barrio".
 * Corazón de la experiencia del cliente: explorar tiendas (anónimo, sin login).
 *
 * Carga tiendas reales de GET /api/stores/search y filtra en cliente por texto
 * y categoría. Maneja los tres estados: cargando (skeletons), error (reintentar)
 * y vacío. Diseño minimalista: un solo acento (navy), tarjetas con borde fino.
 */
import { useMemo, useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { colors } from '@/ui/theme';
import { SearchBar } from '@/components/SearchBar';
import { CategoryChips, type Category } from '@/components/CategoryChips';
import { StoreCard } from '@/components/StoreCard';
import { useStores } from '@/features/stores/hooks';
import type { Store } from '@/features/stores/types';

export default function HomeScreen() {
  const router = useRouter();
  const { stores, loading, refreshing, error, reload, refresh } = useStores({ limit: 50 });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  // Las categorías de las chips se derivan de los datos reales (+ "Todos").
  const categories = useMemo<Category[]>(() => {
    const names = Array.from(
      new Set(stores.map((s) => s.category_name).filter((n): n is string => !!n)),
    ).sort();
    return [{ id: null, name: 'Todos' }, ...names.map((n) => ({ id: n, name: n }))];
  }, [stores]);

  const filtered = useMemo<Store[]>(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      const byCat = !category || s.category_name === category;
      const byText = !q || s.name.toLowerCase().includes(q);
      return byCat && byText;
    });
  }, [stores, search, category]);

  return (
    <Screen>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand[700]} />
        }
        ListHeaderComponent={
          <View>
            {/* Header: marca + ubicación */}
            <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
              <Text style={{ color: colors.brand[700] }} variant="heading">
                Caserita
              </Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={colors.mutedForeground} strokeWidth={2} />
                <Text variant="caption">Concepción, Bío Bío</Text>
              </View>
            </View>

            {/* Título */}
            <View className="px-5 pb-4 pt-2">
              <Text variant="title">Descubre los comercios</Text>
              <Text variant="title">de tu barrio</Text>
            </View>

            {/* Búsqueda */}
            <View className="px-5 pb-3">
              <SearchBar value={search} onChangeText={setSearch} />
            </View>

            {/* Categorías */}
            <View className="pb-4">
              <CategoryChips categories={categories} selectedId={category} onSelect={setCategory} />
            </View>

            {/* Sección */}
            {!loading && !error ? (
              <View className="px-5 pb-2">
                <Text variant="subtitle">Cerca de ti</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-5 pb-3">
            <StoreCard store={item} onPress={() => router.push(`/(public)/store/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonList />
          ) : error ? (
            <ErrorState onRetry={reload} />
          ) : (
            <EmptyState />
          )
        }
      />
    </Screen>
  );
}

/** Placeholders de carga: rectángulos neutros, no spinner a pantalla completa.
 *  Reutiliza <Card> para no duplicar el estilo de superficie de StoreCard. */
function SkeletonList() {
  return (
    <View className="gap-3 px-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-[88px] flex-row items-center gap-3">
          <View className="h-14 w-14 rounded-xl bg-muted" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-2/3 rounded bg-muted" />
            <View className="h-3 w-1/3 rounded bg-muted" />
          </View>
        </Card>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <MapPin size={40} color={colors.mutedForeground} strokeWidth={1.5} />
      <Text variant="subtitle" className="text-center">
        Aún no hay tiendas en tu zona
      </Text>
      <Text variant="caption" className="text-center">
        Prueba con otra categoría o vuelve más tarde.
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center gap-3 px-8 pt-16">
      <Text variant="subtitle" className="text-center">
        No pudimos cargar las tiendas
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
