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
  const { transition, commitTheme } = useThemeStore();
  const [activeTransition, setActiveTransition] = useState(transition);
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (transition?.active && !activeTransition?.active) {
      // Start a new transition
      setActiveTransition(transition);
      scale.value = 0;
      opacity.value = 1;

      // Animate scale to cover the screen
      scale.value = withTiming(
        1,
        { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        (finished) => {
          if (finished) {
            // Once covered, commit the theme change (swaps nativewind vars)
            runOnJS(commitTheme)();
            // Instantly fade out the overlay
            opacity.value = withTiming(0, { duration: 300 }, (f) => {
              if (f) {
                runOnJS(setActiveTransition)(null);
              }
            });
          }
        }
      );
    }
  }, [transition, activeTransition, commitTheme, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!activeTransition?.active) return null;

  // The background color of the expanding circle matches the *next* theme
  const backgroundColor = activeTransition.nextTheme === 'dark' ? '#0f172a' : '#f8fafc'; // Matches global.css --background

  // We need to center the circle at the tap coordinates (x, y)
  // The circle has width/height of MAX_RADIUS * 2
  const diameter = MAX_RADIUS * 2;
  const left = activeTransition.x - MAX_RADIUS;
  const top = activeTransition.y - MAX_RADIUS;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex: 9999, overflow: 'hidden' },
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left,
            top,
            width: diameter,
            height: diameter,
            borderRadius: MAX_RADIUS,
            backgroundColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
