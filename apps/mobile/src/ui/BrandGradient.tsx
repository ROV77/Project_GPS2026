/**
 * Gradiente de marca (navy) reutilizable: fuente única del degradado para el hero
 * del Home y el banner de Cuenta. Colores y puntos como constantes de módulo
 * (refs estables) para no re-renderizar `LinearGradient`.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme';

// Diagonal suave 160°: de brand-700 (arriba-izq) a brand-900 (abajo-der).
const BRAND_COLORS = [colors.brand[700], colors.brand[900]] as const;
const START = { x: 0, y: 0 } as const;
const END = { x: 1, y: 1 } as const;

export function BrandGradient({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient colors={BRAND_COLORS} start={START} end={END} style={style}>
      {children}
    </LinearGradient>
  );
}
