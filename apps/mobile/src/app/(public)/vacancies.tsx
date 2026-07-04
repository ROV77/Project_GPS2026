import React from 'react';
import { View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Store, Clock } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { colors } from '@/ui/theme';
import { useVacancies, useApplyToVacancy } from '@/features/delivery/hooks';
import { useSession } from '@/features/auth/session.store';
import type { DeliveryVacancy } from '@/features/delivery/types';

export default function VacanciesScreen() {
  const { data, loading, refetch } = useVacancies();
  const { mutate: apply, loading: applying } = useApplyToVacancy();
  const user = useSession((s) => s.user);

  const handleApply = async (vacancyId: string) => {
    if (!user) return;
    try {
      await apply(vacancyId, user.id);
      Alert.alert('Éxito', 'Has postulado a la oferta correctamente.');
      refetch();
    } catch (e) {
      Alert.alert('Error', 'No se pudo postular a la oferta. Es posible que ya hayas postulado.');
    }
  };

  const renderItem = ({ item }: { item: DeliveryVacancy }) => (
    <Card className="mb-4">
      <View className="flex-row items-center gap-3 mb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
          <Store size={20} color={colors.brand[700]} />
        </View>
        <View className="flex-1">
          <Text variant="subtitle">{item.stores?.name ?? 'Tienda Desconocida'}</Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Clock size={12} color={colors.mutedForeground} />
            <Text variant="caption">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="body" className="mb-4 text-gray-700">
        {item.description ?? 'Sin descripción'}
      </Text>
      <Button
        label="Postular"
        loading={applying}
        onPress={() => handleApply(item.id)}
      />
    </Card>
  );

  if (loading && data.length === 0) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[700]} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data.filter(v => v.state_id !== '3')} // Assuming 3 is closed, adjust if needed
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshing={loading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text variant="body" className="text-gray-500 text-center">
              No hay ofertas disponibles en este momento.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
