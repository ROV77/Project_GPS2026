/**
 * Superficie blanca con borde fino: el look limpio del sistema de diseño. Si
 * recibe `onPress` se vuelve táctil con feedback sutil. Con `elevated` suma una
 * sombra navy suave para levantar la tarjeta (tiendas, tarjetas destacadas) sin
 * abandonar el estilo plano por defecto.
 */
import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

// Sombra suave de marca (misma familia que Avatar). Constante de módulo: ref estable.
const ELEVATED: ViewStyle = {
  shadowColor: '#0f1d2e',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

export function Card({
  children,
  onPress,
  className,
  elevated = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  elevated?: boolean;
}) {
  const base = `rounded-2xl border border-border bg-card p-4 transition-colors duration-500 ${className ?? ''}`;
  const shadow = elevated ? ELEVATED : undefined;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={base}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, shadow]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} style={shadow}>
      {children}
    </View>
  );
}
