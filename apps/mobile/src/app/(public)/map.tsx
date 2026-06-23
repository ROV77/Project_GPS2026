/**
 * Pestaña Mapa (placeholder de Fase 1). Se implementará con react-native-maps +
 * expo-location en una iteración posterior (ver docs/MOBILE-GUIA-INICIO.md §4).
 */
import { View } from 'react-native';
import { Map as MapIcon } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';

export default function MapScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <MapIcon size={44} color={colors.mutedForeground} strokeWidth={1.5} />
        <Text variant="subtitle" className="text-center">
          Mapa de tiendas
        </Text>
        <Text variant="caption" className="text-center">
          Próximamente: ubica los comercios cercanos en el mapa.
        </Text>
      </View>
    </Screen>
  );
}
