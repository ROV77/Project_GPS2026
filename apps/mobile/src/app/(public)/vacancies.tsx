import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Store, Clock, MapPin } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { useThemeColors } from '@/ui/theme';
import { useVacancies, useApplyToVacancy, useMyApplications } from '@/features/delivery/hooks';
import { useSession } from '@/features/auth/session.store';
import type { DeliveryVacancy } from '@/features/delivery/types';
import { CategoryChips, type Category } from '@/components/CategoryChips';
import { Skeleton } from '@/ui/Skeleton';

export default function VacanciesScreen() {
  const colors = useThemeColors();
  const { data: vacancies, loading, refetch: refetchVacancies } = useVacancies();
  const { mutate: apply, loading: applying } = useApplyToVacancy();
  const user = useSession((s) => s.user);
  
  const { data: myApps, refetch: refetchMyApps } = useMyApplications(user?.id);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusOptions: Category[] = [
    { id: null, name: 'Todas' },
    { id: 'disponibles', name: 'Disponibles' },
    { id: 'postuladas', name: 'Postuladas' },
  ];

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
      <Card elevated className="mb-4">
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

        <Text variant="body" className="mb-4 text-foreground">
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
        <View className="px-5 pb-4 pt-2 border-b border-border bg-background mb-2">
          <Logo variant="border" height={22} />
          <Text variant="title" className="text-foreground mt-3">Ofertas de Trabajo</Text>
          <Text variant="caption" className="text-muted-foreground mt-1">Encuentra y postula a nuevas oportunidades</Text>
        </View>
        <View className="px-4 py-4 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} elevated className="mb-2">
              <View className="flex-row items-center gap-3 mb-4">
                <Skeleton width={40} height={40} borderRadius={20} />
                <View className="flex-1 gap-2">
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
              <Skeleton width="30%" height={12} className="mb-3" />
              <Skeleton width="100%" height={14} className="mb-2" />
              <Skeleton width="80%" height={14} className="mb-6" />
              <Skeleton width="100%" height={48} borderRadius={8} />
            </Card>
          ))}
        </View>
      </Screen>
    );
  }

  const filteredData = vacancies.filter(v => {
    if (v.state_id === '3') return false; // Rejected/Inactive

    const hasApplied = myApps.some(app => app.vacancy_id === v.id);
    if (statusFilter === 'disponibles' && hasApplied) return false;
    if (statusFilter === 'postuladas' && !hasApplied) return false;

    return true;
  });

  return (
    <Screen>
      <View className="px-5 pb-4 pt-2 border-b border-border bg-background mb-2">
        <Logo variant="border" height={22} />
        <Text variant="title" className="text-foreground mt-3">Ofertas de Trabajo</Text>
        <Text variant="caption" className="text-muted-foreground mt-1">Encuentra y postula a nuevas oportunidades</Text>
      </View>
      <View className="pb-3 border-b border-border bg-background mb-2">
        <CategoryChips categories={statusOptions} selectedId={statusFilter} onSelect={setStatusFilter} />
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
            <Text variant="body" className="text-muted-foreground text-center px-6">
              No hay ofertas disponibles en este momento.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
