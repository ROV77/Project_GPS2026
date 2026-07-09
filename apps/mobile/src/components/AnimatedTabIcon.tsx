/**
 * Ícono de tab con una "pill" de fondo y un leve escalado que aparecen con
 * spring al enfocarse. Reemplaza el ícono estático de expo-router Tabs sin
 * tocar tabBarStyle/colores (ver (public)/_layout.tsx).
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/ui/theme';

interface Props {
  Icon: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
}

export function AnimatedTabIcon({ Icon, color, size, focused }: Props) {
  const colors = useThemeColors();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 180 });
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.12 }],
  }));

  return (
    <View style={{ width: 44, height: 30, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: 44, height: 30, borderRadius: 15, backgroundColor: colors.brand[50] },
          pillStyle,
        ]}
      />
      <Animated.View style={iconStyle}>
        <Icon color={color} size={size} strokeWidth={2} />
      </Animated.View>
    </View>
  );
}
