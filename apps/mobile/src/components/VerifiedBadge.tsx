import { useEffect } from 'react';
import { View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '@/ui/theme';

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    // Animación de pulso ("brillo") que se repite infinitamente
    scale.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1.3, { duration: 500 })),
        withTiming(1, { duration: 500 }),
        withDelay(2000, withTiming(1, { duration: 0 }))
      ),
      -1
    );

    opacity.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(0.8, { duration: 500 })),
        withTiming(0.1, { duration: 500 }),
        withDelay(2000, withTiming(0.1, { duration: 0 }))
      ),
      -1
    );
  }, [scale, opacity]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: 'absolute',
    backgroundColor: colors.brand[400],
    borderRadius: size,
    width: size * 0.8,
    height: size * 0.8,
    zIndex: 0,
  }));

  return (
    <View className="items-center justify-center relative" style={{ width: size, height: size }}>
      <Animated.View style={glowStyle} />
      <BadgeCheck size={size} color={colors.brand[500]} strokeWidth={2.5} style={{ zIndex: 1 }} />
    </View>
  );
}
