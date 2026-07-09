import React, { useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSession } from '@/features/auth/session.store';
import { useCourierRatings } from '@/features/delivery/hooks';
import { Star, ChevronLeft } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Logo } from '@/ui/Logo';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/ui/theme';
import { CategoryChips } from '@/components/CategoryChips';
import { Skeleton } from '@/ui/Skeleton';

export default function CourierReviewsScreen() {
  const { user } = useSession();
  const router = useRouter();
  const colors = useThemeColors();

  const { data: reviews, loading: isLoading, error: isError } = useCourierRatings(String(user?.id));
  const [filter, setFilter] = useState<string | null>(null);

  const filterOptions = [
    { id: null, name: 'Todas' },
    { id: 'recientes', name: 'Más recientes' },
    { id: 'mejores', name: 'Mejor valoradas' },
    { id: 'peores', name: 'Peor valoradas' },
  ];

  const processedReviews = useMemo(() => {
    if (!reviews) return [];
    const copy = [...reviews];
    
    if (filter === 'recientes') {
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filter === 'mejores') {
      copy.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    } else if (filter === 'peores') {
      copy.sort((a, b) => (a.stars || 0) - (b.stars || 0));
    }
    return copy;
  }, [reviews, filter]);

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            color={s <= rating ? colors.amber : colors.border}
            fill={s <= rating ? colors.amber : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const header = (
    <View className="px-5 pb-4 pt-2 border-b border-border bg-background flex-row items-center gap-3 mb-2">
      <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-muted">
        <ChevronLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
      <View className="flex-1">
        <Logo variant="border" height={20} />
        <Text variant="title" className="text-foreground mt-2">Mis Reseñas</Text>
        <Text variant="caption" className="text-muted-foreground mt-1">Lo que opinan las tiendas de ti</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <View className="flex-1 bg-background px-4 py-4 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} elevated>
              <View className="flex-row items-center justify-between mb-3">
                <Skeleton width="40%" height={16} />
                <Skeleton width={80} height={16} />
              </View>
              <Skeleton width="100%" height={14} className="mb-2" />
              <Skeleton width="60%" height={14} className="mb-4" />
              <View className="items-end">
                <Skeleton width="20%" height={12} />
              </View>
            </Card>
          ))}
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        {header}
        <View className="flex-1 items-center justify-center p-5 bg-background">
          <Text variant="body" className="text-destructive">Error al cargar las reseñas.</Text>
        </View>
      </Screen>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Screen>
        {header}
        <View className="flex-1 items-center justify-center p-5 bg-background">
          <Text variant="body" className="text-muted-foreground">Aún no tienes ninguna reseña.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <View className="pb-3 border-b border-border bg-background mb-2">
        <CategoryChips categories={filterOptions} selectedId={filter} onSelect={setFilter} />
      </View>
      <FlatList
        data={processedReviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Card elevated>
            <View className="flex-row items-start justify-between mb-2">
              <Text variant="subtitle" className="flex-1 mr-2 text-foreground">
                {/* @ts-ignore */}
                {item.stores?.name || 'Tienda anónima'}
              </Text>
              {renderStars(item.stars || 0)}
            </View>
            <Text variant="body" className="italic mb-3 text-muted-foreground">
              {item.comment ? `"${item.comment}"` : 'Sin comentario'}
            </Text>
            <Text variant="caption" className="text-right text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </Card>
        )}
      />
    </Screen>
  );
}
