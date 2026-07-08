import React, { useEffect } from 'react';
import { ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export function Skeleton({ className, style, width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      ),
      -1, // Loop indefinitely
      true // Reverse direction
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-muted ${className ?? ''}`}
      style={[
        { width, height, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}
