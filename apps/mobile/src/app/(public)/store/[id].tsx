/**
 * Detalle de tienda + catálogo. El catálogo real depende de un endpoint público
 * pendiente en el backend (GET /api/stores/:id/products); mientras tanto esta
 * pantalla deja el armazón navegable. Ver docs/MOBILE-GUIA-INICIO.md §1.2.
 */
import { View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, PackageOpen } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

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
        <Text variant="heading">Tienda</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-3 px-8">
        <PackageOpen size={44} color={colors.mutedForeground} strokeWidth={1.5} />
        <Text variant="subtitle" className="text-center">
          Catálogo en camino
        </Text>
        <Text variant="caption" className="text-center">
          Aquí se mostrará el catálogo de productos (tienda #{id}) cuando el endpoint
          público esté disponible.
        </Text>
      </View>
    </Screen>
  );
}
