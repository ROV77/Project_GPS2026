import React, { useState, useMemo } from 'react';
import { View, SectionList, ActivityIndicator, Linking } from 'react-native';
import { Store, CheckCircle } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { useThemeColors } from '@/ui/theme';
import { useMyApplications } from '@/features/delivery/hooks';
import { useSession } from '@/features/auth/session.store';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import type { CourierApplication } from '@/features/delivery/types';
import { CategoryChips, type Category } from '@/components/CategoryChips';

const GREEN = '#10b981';

export default function ApplicationsScreen() {
  const colors = useThemeColors();
  const user = useSession((s) => s.user);
  const { data, loading, refetch } = useMyApplications(user?.id);

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const locationOptions = useMemo<Category[]>(() => {
    const locations = Array.from(
      new Set(
        data
          .map(a => a.delivery_vacancies?.stores?.communes?.name)
          .filter((n): n is string => !!n)
      )
    ).sort();
    return [{ id: null, name: 'Todas' }, ...locations.map(n => ({ id: n, name: n }))];
  }, [data]);

  const statusOptions: Category[] = [
    { id: null, name: 'Todas' },
    { id: 'nuevas', name: 'Nuevas (Pendientes)' },
    { id: 'aceptadas', name: 'Aceptadas (Trabajando)' },
  ];

  // "Trabajando" = postulaciones aceptadas (state_id 2). El resto (pendientes,
  // rechazadas) va en "Mis postulaciones". Solo se muestran secciones no vacías.
  const sections = useMemo(() => {
    const filteredData = data.filter(a => {
      // Location filter
      if (locationFilter && a.delivery_vacancies?.stores?.communes?.name !== locationFilter) return false;
      
      // Status filter
      if (statusFilter === 'nuevas' && String(a.state_id) !== '1') return false;
      if (statusFilter === 'aceptadas' && String(a.state_id) !== '2') return false;

      return true;
    });

    const activas = filteredData.filter((a) => String(a.state_id) === '2');
    const postulaciones = filteredData.filter((a) => String(a.state_id) !== '2');
    return [
      { title: 'Trabajando', data: activas },
      { title: 'Mis postulaciones', data: postulaciones },
    ].filter((s) => s.data.length > 0);
  }, [data, locationFilter, statusFilter]);

  const getStatusText = (stateId: string | number | null) => {
    switch (String(stateId)) {
      case '1': return { text: 'Pendiente', color: colors.amber };
      case '2': return { text: 'Aceptada', color: GREEN };
      case '3': return { text: 'Rechazada', color: colors.destructive };
      default: return { text: 'Desconocido', color: colors.mutedForeground };
    }
  };

  const renderItem = ({ item, section }: { item: CourierApplication; section: { title: string } }) => {
    const store = item.delivery_vacancies?.stores;
    const status = getStatusText(item.state_id);
    const isActive = section.title === 'Trabajando';
    const whatsappUrl = store
      ? buildWhatsAppUrl(store.store_phone, `Hola ${store.name}, soy tu repartidor 👋`)
      : null;

    return (
      <Card elevated className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
              <Store size={20} color={colors.brand[700]} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle" numberOfLines={1}>{store?.name ?? 'Tienda'}</Text>
              <Text variant="caption">Postulado el {new Date(item.applied_at).toLocaleDateString()}</Text>
            </View>
          </View>
          <View className="px-2 py-1 rounded-md" style={{ backgroundColor: `${status.color}15` }}>
            <Text variant="caption" style={{ color: status.color, fontWeight: '600' }}>
              {status.text}
            </Text>
          </View>
        </View>

        {isActive && (
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle size={16} color={GREEN} />
            <Text variant="caption" style={{ color: GREEN, fontWeight: '600' }}>
              Trabajando aquí
            </Text>
          </View>
        )}

        {isActive && whatsappUrl && (
          <View className="mt-2 pt-3 border-t border-gray-100">
            <Button
              label="Contactar por WhatsApp"
              variant="secondary"
              onPress={() => void Linking.openURL(whatsappUrl)}
            />
          </View>
        )}
      </Card>
    );
  };

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
      <View className="px-5 pb-4 pt-2 border-b border-border bg-background mb-2">
        <Logo variant="border" height={22} />
        <Text variant="title" className="text-foreground mt-3">Mis Postulaciones</Text>
        <Text variant="caption" className="text-muted-foreground mt-1">Revisa tus trabajos activos y el estado de tus solicitudes</Text>
      </View>
      <View className="pb-3 border-b border-border bg-background mb-2">
        <View className="mb-3">
          <CategoryChips categories={statusOptions} selectedId={statusFilter} onSelect={setStatusFilter} />
        </View>
        <CategoryChips categories={locationOptions} selectedId={locationFilter} onSelect={setLocationFilter} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text variant="subtitle" className="text-foreground mb-3">{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: 20 }}
        refreshing={loading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text variant="body" className="text-muted-foreground text-center">
              No tienes postulaciones recientes.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
