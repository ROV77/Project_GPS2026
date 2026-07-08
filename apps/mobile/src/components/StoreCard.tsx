/**
 * Tarjeta de tienda para la lista de la Home. Logo (RemoteImage) + nombre +
 * meta (categoría · comuna) + rating con estrella ámbar. Toca → store/[id].
 */
import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Card } from '@/ui/Card';
import { Text } from '@/ui/Text';
import { RemoteImage } from '@/ui/RemoteImage';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { useThemeColors, colors } from '@/ui/theme';
import type { Store } from '@/features/stores/types';
import { formatStoreAddressShort } from '@/features/stores/formatStoreAddress';

export function StoreCard({ store, onPress }: { store: Store; onPress: () => void }) {
  const rating = Number(store.avg_rating) || 0;
  const addressShort = formatStoreAddressShort(store);
  const meta = [store.category_name, addressShort || store.commune_name].filter(Boolean).join(' · ');

  return (
    <Card onPress={onPress} elevated className="overflow-hidden p-0 border-0">
      <View className="h-[120px] w-full bg-muted">
        <RemoteImage
          uri={store.logo_url}
          rounded={0}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      <View className="p-3">
        <View className="flex-row items-center gap-1">
          <Text variant="subtitle" numberOfLines={1} className="flex-shrink">
            {store.name}
          </Text>
          {store.verified ? (
            <VerifiedBadge size={16} />
          ) : null}
        </View>

        {meta ? (
          <Text variant="label" numberOfLines={1} className="mt-0.5">
            {meta}
          </Text>
        ) : null}

        <View className="mt-1 flex-row items-center gap-1">
          <Star size={14} color={colors.amber} fill={colors.amber} strokeWidth={0} />
          <Text variant="caption" className="text-foreground font-medium">
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
