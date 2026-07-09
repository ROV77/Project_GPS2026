/**
 * Campana de notificaciones con badge de no leídas. Abre el buzón (/notifications).
 * Solo se muestra con sesión iniciada (sin cuenta no hay buzón). El color del
 * ícono se pasa por prop para adaptarse al fondo (navy del hero vs barra clara).
 */
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Text } from '@/ui/Text';
import { useThemeColors } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';
import { useNotifications } from '@/features/notifications/notifications.store';

export function NotificationBell({ color, size = 22 }: { color: string; size?: number }) {
  const colors = useThemeColors();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const unread = useNotifications((s) => s.unread);

  if (status !== 'authenticated') return null;

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Notificaciones"
      className="active:opacity-70"
    >
      <Bell size={size} color={color} strokeWidth={2} />
      {unread > 0 ? (
        <View
          className="absolute -right-2 -top-1.5 min-w-[16px] items-center justify-center rounded-full px-1"
          style={{ height: 16, backgroundColor: colors.destructive }}
        >
          <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
