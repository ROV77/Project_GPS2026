/**
 * Marker memoizado para el mapa. Pin compacto (vista circular con ícono y
 * color según el rubro de la tienda, ver features/stores/categoryStyle.ts).
 * Al pulsarlo el padre selecciona la tienda y el carrusel salta a su tarjeta.
 *
 * `coordinate` llega como prop del PADRE (no se deriva adentro) porque la
 * librería de clustering (react-native-map-clustering) lee `child.props.coordinate`
 * para decidir qué markers agrupar; sin esa prop el marker quedaría fuera del
 * clustering.
 *
 * React.memo impide re-renders innecesarios cuando el padre re-renderiza por
 * cambios de `region`. No se usa `tracksViewChanges` (rompe el touch en
 * Android con vistas custom).
 */
import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { colors } from '@/ui/theme';
import { getCategoryStyle } from '@/features/stores/categoryStyle';
import type { Store } from '@/features/stores/types';

interface Props {
  store: Store;
  coordinate: { latitude: number; longitude: number };
  selected: boolean;
  onPress: (id: string) => void;
}

function StoreMarkerImpl({ store, coordinate, selected, onPress }: Props) {
  const { Icon, color } = getCategoryStyle(store.category_name);

  return (
    <Marker coordinate={coordinate} onPress={() => onPress(store.id)}>
      {/* Pin compacto: vista circular con ícono, borde blanco + sombra.
          Seleccionado: crece un poco y el borde toma el color de la marca. */}
      <View style={localStyles.pinOuter}>
        <View
          style={[
            localStyles.pinInner,
            { backgroundColor: color },
            selected && localStyles.pinSelected,
          ]}
        >
          <Icon size={selected ? 16 : 14} color={colors.white} strokeWidth={2.25} />
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
  pinSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderColor: colors.brand[900],
  },
});
