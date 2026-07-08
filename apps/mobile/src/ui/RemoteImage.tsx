/**
 * Imagen remota del catálogo (logo de tienda / foto de producto). Envuelve
 * `expo-image` para tener caché en disco, transición suave y un fallback con
 * ícono cuando la URL es nula o falla.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Store as StoreIcon } from 'lucide-react-native';
import { displayWidth, optimizeCloudinaryUrl } from '@/lib/cloudinaryImage';
import { type ImageProps } from 'expo-image';
import { colors } from './theme';

export function RemoteImage({
  uri,
  size,
  rounded = 12,
  style,
  className,
  ...props
}: {
  uri?: string | null;
  size?: number;
  rounded?: number;
  style?: any;
  className?: string;
} & Partial<ImageProps>) {
  const [failed, setFailed] = useState(false);
  const imgWidth = size ?? (style?.width || 56);
  const imgHeight = size ?? (style?.height || 56);
  const optimized = optimizeCloudinaryUrl(uri, { width: displayWidth(typeof imgWidth === 'number' ? imgWidth : 300) });
  const showFallback = !optimized || failed;

  if (showFallback) {
    return (
      <View
        className={`items-center justify-center bg-muted ${className || ''}`}
        style={[{ width: imgWidth, height: imgHeight, borderRadius: rounded }, style]}
      >
        <StoreIcon size={typeof imgWidth === 'number' ? imgWidth * 0.4 : 24} color={colors.mutedForeground} strokeWidth={1.75} />
      </View>
    );
  }

  return (
    <Image
      source={optimized}
      onError={() => setFailed(true)}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      className={className}
      style={[{ width: imgWidth, height: imgHeight, borderRadius: rounded }, style]}
      {...props}
    />
  );
}
