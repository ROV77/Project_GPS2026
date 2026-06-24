/**
 * Superficie blanca con borde fino (no sombra pesada): el look limpio y plano
 * del sistema de diseño. Si recibe `onPress` se vuelve táctil con feedback sutil.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

export function Card({
  children,
  onPress,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const base = `rounded-2xl border border-border bg-card p-4 ${className ?? ''}`;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={base}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={base}>{children}</View>;
}
