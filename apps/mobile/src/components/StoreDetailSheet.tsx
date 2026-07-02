/**
 * Panel deslizable con la info de la tienda seleccionada en el mapa. Solo
 * reformatea campos que YA vienen en `Store` (GET /stores/search) — no hay
 * endpoint de detalle todavía (/store/[id].tsx es un placeholder), así que
 * no se inventa data (horario, teléfono, fotos) que la API no entrega hoy.
 *
 * `BottomSheet` inline (no Modal): no requiere BottomSheetModalProvider, solo
 * el GestureHandlerRootView que ya envuelve la app en app/_layout.tsx.
 */
import { forwardRef, useCallback, useMemo } from 'react';
import { View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Star, BadgeCheck, MapPin } from 'lucide-react-native';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { RemoteImage } from '@/ui/RemoteImage';
import { colors } from '@/ui/theme';
import { getCategoryStyle } from '@/features/stores/categoryStyle';
import type { Store } from '@/features/stores/types';

interface Props {
  store: Store | null;
  onClose: () => void;
}

export const StoreDetailSheet = forwardRef<BottomSheet, Props>(function StoreDetailSheet(
  { store, onClose },
  ref,
) {
  const router = useRouter();
  const snapPoints = useMemo(() => ['1%', '42%', '75%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    [],
  );

  const handleChange = useCallback(
    (index: number) => {
      if (index <= 0) onClose();
    },
    [onClose],
  );

  const style = store ? getCategoryStyle(store.category_name) : null;
  const rating = store ? Number(store.avg_rating) || 0 : 0;
  const location = store ? [store.commune_name, store.region_name].filter(Boolean).join(', ') : '';
  const lat = store ? Number(store.latitude) : NaN;
  const lng = store ? Number(store.longitude) : NaN;
  const canNavigate = !Number.isNaN(lat) && !Number.isNaN(lng);

  const openDirections = () => {
    void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleChange}
    >
      {store && style ? (
        <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <RemoteImage uri={store.logo_url} size={64} rounded={16} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="subtitle" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {store.name}
                </Text>
                {store.verified ? <BadgeCheck size={16} color={colors.brand[500]} strokeWidth={2} /> : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <style.Icon size={13} color={style.color} strokeWidth={2.25} />
                <Text variant="caption" style={{ color: style.color }}>{store.category_name ?? 'Tienda'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Star size={13} color={colors.amber} fill={colors.amber} strokeWidth={0} />
                <Text variant="caption">{rating > 0 ? rating.toFixed(1) : 'Nuevo'}</Text>
                {store.review_count > 0 ? (
                  <Text variant="caption">· {store.review_count} reseñas</Text>
                ) : null}
              </View>
            </View>
          </View>

          {location ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={colors.mutedForeground} strokeWidth={2} />
              <Text variant="body" style={{ color: colors.mutedForeground }}>{location}</Text>
            </View>
          ) : null}

          {store.description ? (
            <Text variant="body" style={{ color: colors.foreground }}>
              {store.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            {canNavigate ? (
              <View style={{ flex: 1 }}>
                <Button label="Cómo llegar" variant="secondary" onPress={openDirections} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button label="Ver tienda completa" onPress={() => router.push(`/store/${store.id}`)} />
            </View>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetView>
          <View />
        </BottomSheetView>
      )}
    </BottomSheet>
  );
});
