/**
 * Texto tipográfico de la app. Centraliza la escala (tamaño + familia Inter +
 * color por defecto) para garantizar jerarquía y consistencia minimalista.
 *
 * La familia de Inter se aplica por `style` (no por className) porque cada peso
 * es una fuente distinta cargada en el root layout. El color/spacing extra se
 * pasa por `className` (NativeWind).
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { fonts } from './theme';

type Variant = 'title' | 'heading' | 'subtitle' | 'body' | 'label' | 'caption';

const VARIANT: Record<Variant, { size: number; line: number; family: string; color: string }> = {
  title: { size: 28, line: 34, family: fonts.bold, color: 'text-foreground' },
  heading: { size: 18, line: 24, family: fonts.semibold, color: 'text-foreground' },
  subtitle: { size: 16, line: 22, family: fonts.semibold, color: 'text-foreground' },
  body: { size: 15, line: 21, family: fonts.regular, color: 'text-foreground' },
  label: { size: 13, line: 18, family: fonts.medium, color: 'text-muted-foreground' },
  caption: { size: 12, line: 16, family: fonts.regular, color: 'text-muted-foreground' },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'body', className, style, ...rest }: TextProps) {
  const v = VARIANT[variant];
  return (
    <RNText
      className={`${v.color} ${className ?? ''}`}
      style={[{ fontFamily: v.family, fontSize: v.size, lineHeight: v.line }, style]}
      {...rest}
    />
  );
}
