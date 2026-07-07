import React from 'react';
import { View, Text as RNText, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useSession } from '@/features/auth/session.store';
import { useCourierRatings } from '@/features/delivery/hooks';
import { Star, ChevronLeft } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Logo } from '@/ui/Logo';
import { useRouter } from 'expo-router';

export default function CourierReviewsScreen() {
  const { user } = useSession();
  const router = useRouter();

  const { data: reviews, loading: isLoading, error: isError } = useCourierRatings(String(user?.id));

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={16}
            color={s <= rating ? '#EAB308' : '#D1D5DB'}
            fill={s <= rating ? '#EAB308' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const header = (
    <View className="px-5 pb-4 pt-2 border-b border-gray-100 bg-white flex-row items-center gap-3 mb-2">
      <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-gray-100">
        <ChevronLeft size={24} color="#111827" />
      </TouchableOpacity>
      <View className="flex-1">
        <Logo variant="plain" height={20} />
        <Text variant="title" className="text-brand-900 mt-2">Mis Reseñas</Text>
        <Text variant="caption" className="text-gray-500 mt-1">Lo que opinan las tiendas de ti</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        {header}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        {header}
        <View style={styles.centerContainer}>
          <RNText style={styles.errorText}>Error al cargar las reseñas.</RNText>
        </View>
      </Screen>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Screen>
        {header}
        <View style={styles.centerContainer}>
          <RNText style={styles.emptyText}>Aún no tienes ninguna reseña.</RNText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <RNText style={styles.storeName}>
                {/* @ts-ignore */}
                {item.stores?.name || 'Tienda anónima'}
              </RNText>
              {renderStars(item.stars || 0)}
            </View>
            <RNText style={styles.comment}>
              {item.comment ? `"${item.comment}"` : 'Sin comentario'}
            </RNText>
            <RNText style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </RNText>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
