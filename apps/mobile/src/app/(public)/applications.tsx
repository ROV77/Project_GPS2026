import React from 'react';
import { View, FlatList, ActivityIndicator, Linking } from 'react-native';
import { Store, MessageCircle } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { colors } from '@/ui/theme';
import { useMyApplications } from '@/features/delivery/hooks';
import { useSession } from '@/features/auth/session.store';
import type { CourierApplication } from '@/features/delivery/types';

export default function ApplicationsScreen() {
  const user = useSession((s) => s.user);
  const { data, loading, refetch } = useMyApplications(user?.id);

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${cleanPhone}`);
      }
    });
  };

  const getStatusText = (stateId: string | number | null) => {
    switch (String(stateId)) {
      case '1': return { text: 'Pendiente', color: colors.amber };
      case '2': return { text: 'Aceptada', color: colors.success };
      case '3': return { text: 'Rechazada', color: colors.destructive };
      default: return { text: 'Desconocido', color: colors.mutedForeground };
    }
  };

  const renderItem = ({ item }: { item: CourierApplication }) => {
    const store = item.delivery_vacancies?.stores;
    const status = getStatusText(item.state_id);

    return (
      <Card className="mb-4">
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

        {String(item.state_id) === '2' && store?.store_phone && (
          <View className="mt-2 pt-3 border-t border-gray-100">
            <Button
              label="Coordinar con el dueño"
              variant="secondary"
              onPress={() => openWhatsApp(store.store_phone)}
              // eslint-disable-next-line react/no-unstable-nested-components
              icon={() => <MessageCircle size={18} color={colors.brand[700]} />}
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
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshing={loading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text variant="body" className="text-gray-500 text-center">
              No tienes postulaciones recientes.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
