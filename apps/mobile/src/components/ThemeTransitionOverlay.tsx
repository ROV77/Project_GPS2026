import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeStore } from '@/ui/themeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Calculate maximum possible radius needed to cover the screen from any point
const MAX_RADIUS = Math.sqrt(Math.pow(SCREEN_WIDTH, 2) + Math.pow(SCREEN_HEIGHT, 2));

export function ThemeTransitionOverlay() {
  const { transition, clearTransition } = useThemeStore();
  const [activeTransition, setActiveTransition] = useState(transition);
  
  const scale = useSharedValue(0);

  useEffect(() => {
    if (transition?.active && !activeTransition?.active) {
      setActiveTransition(transition);
      scale.value = 0;
      
      // Animate scale to cover the screen. Matches Tailwind duration-500
      scale.value = withTiming(
        1,
        { duration: 500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        (finished) => {
          if (finished) {
            runOnJS(clearTransition)();
            runOnJS(setActiveTransition)(null);
          }
        }
      );
    }
  }, [transition, activeTransition, clearTransition, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isTransitioning = activeTransition?.active;
  const currentTheme = useThemeStore((s) => s.theme);
  
  // When transitioning, the base is the OLD theme, and the circle is the NEW theme.
  // When NOT transitioning, the base is simply the CURRENT theme.
  const oldBgColor = isTransitioning && activeTransition?.oldTheme === 'dark' ? '#0f172a' : (currentTheme === 'dark' ? '#0f172a' : '#f8fafc');
  const newBgColor = isTransitioning && activeTransition?.nextTheme === 'dark' ? '#0f172a' : '#f8fafc';

  // Origin: Top Right
  const x = SCREEN_WIDTH;
  const y = 0;
  
  const diameter = MAX_RADIUS * 2;
  const left = x - MAX_RADIUS;
  const top = y - MAX_RADIUS;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex: -1, overflow: 'hidden', backgroundColor: oldBgColor },
      ]}
    >
      {isTransitioning && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left,
              top,
              width: diameter,
              height: diameter,
              borderRadius: MAX_RADIUS,
              backgroundColor: newBgColor,
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}
