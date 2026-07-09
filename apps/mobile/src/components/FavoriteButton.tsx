/**
 * Botón de corazón para marcar/desmarcar una tienda como favorita.
 * - Anónimo: invita a iniciar sesión (no hay favoritos sin cuenta).
 * - Autenticado: alterna de forma optimista vía el store de favoritos.
 * Reutilizable: se usa en el detalle de tienda (y sirve para tarjetas a futuro).
 */
import { useState } from 'react';
import { Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useThemeColors } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';
import { useFavorites } from '@/features/favorites/favorites.store';
import { getApiErrorMessage } from '@/shared/api/errors';
import type { Store } from '@/features/stores/types';

export function FavoriteButton({ store, size = 24 }: { store: Store; size?: number }) {
  const colors = useThemeColors();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const isFavorite = useFavorites((s) => s.ids.has(store.id));
  const toggle = useFavorites((s) => s.toggle);
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (status !== 'authenticated') {
      Alert.alert(
        'Inicia sesión',
        'Crea una cuenta o inicia sesión para guardar tiendas en favoritos.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/login') },
        ],
      );
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await toggle(store);
    } catch (e) {
      Alert.alert('No se pudo actualizar', getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
      style={{ opacity: busy ? 0.5 : 1 }}
    >
      <Heart
        size={size}
        color={isFavorite ? colors.destructive : colors.foreground}
        fill={isFavorite ? colors.destructive : 'transparent'}
        strokeWidth={2}
      />
    </Pressable>
  );
}
