/**
 * Marker memoizado para el mapa. Pin compacto (vista circular con ícono de
 * tienda). Al pulsarlo el padre muestra la info de la tienda en un panel
 * inferior (no usa Callout). El icono se oscurece al estar seleccionado.
 *
 * React.memo impide re-renders innecesarios cuando el padre (MapView) re-
 * renderiza por cambios de `region`. Con ~20 markers visibles esto es
 * suficiente; no se usa `tracksViewChanges` (rompe el touch en Android con
 * vistas custom).
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Store as StoreIcon } from 'lucide-react-native';
import { colors } from '@/ui/theme';
import type { Store } from '@/features/stores/types';

interface Props {
  store: Store;
  selected: boolean;
  onPress: (id: string) => void;
}

function StoreMarkerImpl({ store, selected, onPress }: Props) {
  const lat = Number(store.latitude);
  const lng = Number(store.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const accent = selected ? colors.brand[700] : colors.brand[500];

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      onPress={() => onPress(store.id)}
    >
      {/* Pin compacto: vista circular con ícono, borde blanco + sombra */}
      <View style={localStyles.pinOuter}>
        <View style={[localStyles.pinInner, { backgroundColor: accent }]}>
          <StoreIcon size={14} color={colors.white} strokeWidth={2.25} />
        </View>
      </View>
    </Marker>
  );
}

// Comparador custom: re-renderiza solo si cambia el id o la selección.
export const StoreMarker = memo(
  StoreMarkerImpl,
  (prev, next) =>
    prev.store.id === next.store.id &&
    prev.selected === next.selected &&
    prev.onPress === next.onPress,
);

const localStyles = StyleSheet.create({
  pinOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pinInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});