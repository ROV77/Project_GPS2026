/**
 * Burbuja de cluster para el mapa (prop `renderCluster` de
 * react-native-map-clustering). Reemplaza el ClusterMarker por defecto de la
 * librería, que anida un halo `position: absolute` detrás del círculo — en
 * Android (Fabric) esa capa a veces se snapshotea a medio layout y el cluster
 * sale recortado/glitcheado. Esta versión usa una sola vista circular, mismo
 * patrón que StoreMarker.tsx (que nunca tuvo ese problema).
 */
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Text } from '@/ui/Text';
import { colors, fonts } from '@/ui/theme';

interface ClusterProps {
  onPress: () => void;
  geometry: { coordinates: [number, number] };
  properties: { point_count: number };
}

// Tamaño crece levemente con la cantidad de tiendas agrupadas.
function sizeFor(count: number) {
  if (count >= 25) return 48;
  if (count >= 10) return 42;
  if (count >= 4) return 38;
  return 34;
}

export function ClusterMarker({ onPress, geometry, properties }: ClusterProps) {
  const [lng, lat] = geometry.coordinates;
  const size = sizeFor(properties.point_count);

  return (
    <Marker coordinate={{ latitude: lat, longitude: lng }} onPress={onPress} tracksViewChanges>
      <View style={localStyles.outer}>
        <View style={[localStyles.inner, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.white }}>
            {properties.point_count}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

const localStyles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: colors.brand[700],
  },
});
