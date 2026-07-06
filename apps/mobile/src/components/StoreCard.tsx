/**
 * Tarjeta de tienda para la lista de la Home. Logo (RemoteImage) + nombre +
 * meta (categoría · comuna) + rating con estrella ámbar. Toca → store/[id].
 */
import { View } from 'react-native';
import { Star, BadgeCheck } from 'lucide-react-native';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { RemoteImage } from '@/ui/RemoteImage';
import { colors } from '@/ui/theme';
import type { Store } from '@/features/stores/types';
import { formatStoreAddressShort } from '@/features/stores/formatStoreAddress';

export function StoreCard({ store, onPress }: { store: Store; onPress: () => void }) {
  const rating = Number(store.avg_rating) || 0;
  const addressShort = formatStoreAddressShort(store);
  const meta = [store.category_name, addressShort || store.commune_name].filter(Boolean).join(' · ');

  return (
    <Card onPress={onPress} elevated className="flex-row items-center gap-3">
      <RemoteImage uri={store.logo_url} size={56} />

      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text variant="subtitle" numberOfLines={1} className="flex-shrink">
            {store.name}
          </Text>
          {store.verified ? (
            <BadgeCheck size={16} color={colors.brand[500]} strokeWidth={2} />
          ) : null}
        </View>

        {meta ? (
          <Text variant="label" numberOfLines={1} className="mt-0.5">
            {meta}
          </Text>
        ) : null}

        <View className="mt-1 flex-row items-center gap-1">
          <Star size={14} color={colors.amber} fill={colors.amber} strokeWidth={0} />
          <Text variant="caption" className="text-foreground">
            {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
          </Text>
          {store.review_count > 0 ? (
            <Text variant="caption">· {store.review_count} reseñas</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
