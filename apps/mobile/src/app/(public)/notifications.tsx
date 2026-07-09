/**
 * Buzón de notificaciones in-app. Lista los avisos del usuario (p.ej. nuevas
 * promociones de tiendas favoritas). Tocar un aviso lo marca como leído y, si
 * trae `store_id` en metadata, navega a la tienda. Pull-to-refresh recarga.
 * Se llega desde la campana del header de Explorar; oculta de la TabBar.
 */
import { useState } from 'react';
import { View, Pressable, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, BellOff, CheckCheck } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { useThemeColors } from '@/ui/theme';
import { useNotifications } from '@/features/notifications/notifications.store';
import type { AppNotification } from '@/features/notifications/types';

/** "hace X": tiempo relativo compacto en español a partir de un ISO. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'hace un momento';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString('es-CL');
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const items = useNotifications((s) => s.items);
  const status = useNotifications((s) => s.status);
  const unread = useNotifications((s) => s.unread);
  const hydrate = useNotifications((s) => s.hydrate);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  };

  const onPressItem = (n: AppNotification) => {
    void markRead(n.id);
    const storeId = n.metadata?.store_id;
    if (storeId) {
      router.push({ pathname: '/(public)/store/[id]', params: { id: storeId } });
    }
  };

  const loading = status === 'loading' && items.length === 0;

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="h-10 w-10 items-center justify-center rounded-full"
          hitSlop={8}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="heading" className="flex-1">Notificaciones</Text>
        {unread > 0 ? (
          <Pressable
            onPress={() => void markAllRead()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como leídas"
            className="flex-row items-center gap-1 active:opacity-70"
          >
            <CheckCheck size={18} color={colors.brand[700]} />
            <Text variant="caption" style={{ color: colors.brand[700] }}>Marcar leídas</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={loading ? [] : items}
        keyExtractor={(n: AppNotification) => n.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[700]} />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressItem(item)}
            className="mx-4 mb-2 rounded-2xl border border-border p-4 active:opacity-80"
            style={{ backgroundColor: item.is_read ? colors.card : colors.muted }}
          >
            <View className="flex-row items-start gap-2">
              {!item.is_read ? (
                <View
                  className="mt-1.5 h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors.brand[500] }}
                />
              ) : (
                <View className="mt-1.5 h-2 w-2" />
              )}
              <View className="flex-1">
                {item.title ? (
                  <Text variant="subtitle" className="text-foreground">{item.title}</Text>
                ) : null}
                {item.body ? (
                  <Text variant="body" className="text-muted-foreground mt-0.5">{item.body}</Text>
                ) : null}
                <Text variant="caption" className="text-muted-foreground mt-1">
                  {timeAgo(item.created_at)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={loading ? null : <EmptyState />}
      />
    </Screen>
  );
}

function EmptyState() {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <BellOff size={40} color={colors.mutedForeground} strokeWidth={1.5} />
      <Text variant="subtitle" className="text-center">
        Sin notificaciones
      </Text>
      <Text variant="caption" className="text-center">
        Marca tiendas como favoritas para enterarte de sus promociones.
      </Text>
    </View>
  );
}
