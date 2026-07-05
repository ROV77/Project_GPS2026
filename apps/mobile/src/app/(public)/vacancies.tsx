import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Store, Clock, MapPin } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { colors } from '@/ui/theme';
import { useVacancies, useApplyToVacancy, useMyApplications } from '@/features/delivery/hooks';
import { useSession } from '@/features/auth/session.store';
import type { DeliveryVacancy } from '@/features/delivery/types';

export default function VacanciesScreen() {
  const { data: vacancies, loading, refetch: refetchVacancies } = useVacancies();
  const { mutate: apply, loading: applying } = useApplyToVacancy();
  const user = useSession((s) => s.user);
  
  const { data: myApps, refetch: refetchMyApps } = useMyApplications(user?.id);

  const handleApply = (vacancyId: string) => {
    if (!user) return;
    Alert.alert(
      'Confirmar postulación',
      '¿Estás seguro de que deseas postular a esta oferta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Postular', 
          onPress: async () => {
            try {
              await apply(vacancyId, user.id);
              Alert.alert('Éxito', 'Has postulado a la oferta correctamente.');
              refetchVacancies();
              refetchMyApps();
            } catch (e) {
              Alert.alert('Error', 'No se pudo postular a la oferta. Es posible que ya hayas postulado.');
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: DeliveryVacancy }) => {
    const hasApplied = myApps.some(app => app.vacancy_id === item.id);
    const locationStr = item.stores?.communes?.name 
      ? `${item.stores.communes.name}, ${item.stores.regions?.name ?? ''}` 
      : 'Ubicación no especificada';

    return (
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
        
        <View className="flex-row items-center gap-1 mb-3">
          <MapPin size={14} color={colors.mutedForeground} />
          <Text variant="caption">{locationStr}</Text>
        </View>

        <Text variant="body" className="mb-4 text-gray-700">
          {item.description ?? 'Sin descripción'}
        </Text>
        <Button
          label={hasApplied ? 'Postulado' : 'Postular'}
          variant={hasApplied ? 'secondary' : 'primary'}
          loading={applying}
          disabled={hasApplied}
          onPress={() => handleApply(item.id)}
        />
      </Card>
    );
  };

  if (loading && vacancies.length === 0) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[700]} />
        </View>
      </Screen>
    );
  }

  const filteredData = vacancies.filter(v => v.state_id !== '3');

  return (
    <Screen>
      <View className="px-5 pb-4 pt-2 border-b border-gray-100 bg-white mb-2">
        <Text variant="title" className="text-brand-900">Ofertas de Trabajo</Text>
        <Text variant="caption" className="text-gray-500 mt-1">Encuentra y postula a nuevas oportunidades</Text>
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshing={loading}
        onRefresh={() => { refetchVacancies(); refetchMyApps(); }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text variant="body" className="text-gray-500 text-center px-6">
              No hay ofertas disponibles en este momento.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
