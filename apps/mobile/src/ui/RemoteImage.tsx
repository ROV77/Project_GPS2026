/**
 * Imagen remota del catálogo (logo de tienda / foto de producto). Envuelve
 * `expo-image` para tener caché en disco, transición suave y un fallback con
 * ícono cuando la URL es nula o falla. Es el equivalente mobile del
 * `ProductThumb` del web (apps/web/src/shared/components/ProductThumb.tsx).
 *
 * El mobile SOLO muestra imágenes (nunca las sube). Recibe `image_url` tal cual
 * viene de la API. Ver docs/AUTH-WEB-VS-MOBILE.md y la guía de imágenes.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Store as StoreIcon } from 'lucide-react-native';
import { colors } from './theme';

export function RemoteImage({
  uri,
  size = 56,
  rounded = 12,
}: {
  uri?: string | null;
  size?: number;
  rounded?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !uri || failed;

  if (showFallback) {
    return (
      <View
        className="items-center justify-center bg-brand-50"
        style={{ width: size, height: size, borderRadius: rounded }}
      >
        <StoreIcon size={size * 0.4} color={colors.brand[700]} strokeWidth={1.75} />
      </View>
    );
  }

  return (
    <Image
      source={uri}
      onError={() => setFailed(true)}
      contentFit="cover"
      transition={200}
      style={{ width: size, height: size, borderRadius: rounded }}
    />
  );
}
