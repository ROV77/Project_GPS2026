/**
 * Campo de texto del sistema de diseño: card blanca con borde fino, ícono lineal
 * opcional a la izquierda y placeholder en muted. Reutilizable en login/registro.
 */
import type { ReactNode } from 'react';
import { View, TextInput, type TextInputProps } from 'react-native';
import { colors, fonts } from './theme';

export interface InputProps extends TextInputProps {
  icon?: ReactNode;
}

export function Input({ icon, ...rest }: InputProps) {
  return (
    <View className="h-14 flex-row items-center gap-3 rounded-xl border border-border bg-card px-4">
      {icon}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        className="flex-1"
        style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.foreground }}
        {...rest}
      />
    </View>
  );
}
