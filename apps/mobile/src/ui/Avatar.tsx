/**
 * Avatar del usuario: muestra `avatar_url` con expo-image y un fallback de ícono
 * de persona (a diferencia de RemoteImage, cuyo fallback es un ícono de tienda).
 * Si recibe `onPress` se vuelve táctil y muestra un badge de cámara para editar;
 * con `loading` superpone un spinner mientras se sube la nueva foto.
 */
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { User, Camera } from 'lucide-react-native';
import { colors } from './theme';

export function Avatar({
  uri,
  size = 64,
  onPress,
  loading = false,
}: {
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  loading?: boolean;
}) {
  const radius = size / 2;

  const inner = (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={uri}
          contentFit="cover"
          transition={200}
          style={{ width: size, height: size, borderRadius: radius }}
        />
      ) : (
        <View
          className="items-center justify-center bg-brand-50"
          style={{ width: size, height: size, borderRadius: radius }}
        >
          <User size={size * 0.5} color={colors.brand[700]} strokeWidth={1.75} />
        </View>
      )}

      {loading && (
        <View
          className="absolute items-center justify-center"
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: 'rgba(15,29,46,0.45)',
          }}
        >
          <ActivityIndicator color={colors.white} />
        </View>
      )}

      {onPress && !loading && (
        <View
          className="absolute items-center justify-center rounded-full bg-brand-700"
          style={{
            width: size * 0.32,
            height: size * 0.32,
            right: -2,
            bottom: -2,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Camera size={size * 0.17} color={colors.white} strokeWidth={2} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Cambiar foto de perfil"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
