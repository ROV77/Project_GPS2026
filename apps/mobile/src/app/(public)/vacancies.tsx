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

  const [tab, setTab] = useState<'area' | 'all'>('all');

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
          variant={hasApplied ? 'outline' : 'primary'}
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

  // Determine user's commune from address or defaults
  const userCommune = user?.addresses?.[0]?.commune_id;

  const filteredData = vacancies
    .filter(v => v.state_id !== '3') // Exclude closed vacancies
    .filter(v => {
      if (tab === 'all') return true;
      // If "En tu área", try to match commune, but since addresses might not populate commune_id
      // strictly, if user has no address, we show none or show all? 
      // For now we filter strictly. If no userCommune, it will be empty.
      return v.stores?.communes?.name && user?.addresses?.[0]?.city === v.stores?.communes?.name; 
      // Note: city in user addresses might match commune name, or we just rely on standard filtering.
      // Wait, user addresses have city (string). Let's just match city with commune name.
    });

  return (
    <Screen>
      <View className="flex-row bg-gray-100 p-1 m-4 rounded-lg">
        <TouchableOpacity 
          className={`flex-1 py-2 rounded-md items-center ${tab === 'area' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setTab('area')}
        >
          <Text variant="body" className={`font-medium ${tab === 'area' ? 'text-brand-700' : 'text-gray-500'}`}>
            En tu área
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-2 rounded-md items-center ${tab === 'all' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setTab('all')}
        >
          <Text variant="body" className={`font-medium ${tab === 'all' ? 'text-brand-700' : 'text-gray-500'}`}>
            Todas
          </Text>
        </TouchableOpacity>
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
              {tab === 'area' 
                ? 'No hay ofertas en tu área o no tienes una dirección guardada en tu perfil.' 
                : 'No hay ofertas disponibles en este momento.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
