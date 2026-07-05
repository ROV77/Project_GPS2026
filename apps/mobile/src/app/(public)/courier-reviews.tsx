import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSessionStore } from '@/features/auth/session.store';
import { useCourierRatings } from '@/features/delivery/hooks';
import { Star } from 'lucide-react-native';

export default function CourierReviewsScreen() {
  const { user } = useSessionStore();

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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error al cargar las reseñas.</Text>
      </View>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Aún no tienes ninguna reseña.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.storeName}>
                {/* @ts-ignore */}
                {item.stores?.name || 'Tienda anónima'}
              </Text>
              {renderStars(item.stars || 0)}
            </View>
            <Text style={styles.comment}>
              {item.comment ? `"${item.comment}"` : 'Sin comentario'}
            </Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </View>
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
