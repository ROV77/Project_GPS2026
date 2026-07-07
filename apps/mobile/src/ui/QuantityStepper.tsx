/**
 * Control de cantidad [ − ] n [ + ]. Reutilizable en la tarjeta de producto y en
 * el detalle del pedido. Botones circulares con borde fino (look plano del sistema).
 */
import type { ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Text } from './Text';
import { colors } from './theme';

export function QuantityStepper({
  qty,
  onDecrement,
  onIncrement,
  maxQty,
}: {
  qty: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Stock máximo permitido (desde el panel del comercio). */
  maxQty?: number;
}) {
  const atMax = maxQty != null && qty >= maxQty;

  return (
    <View className="flex-row items-center gap-3">
      <StepButton onPress={onDecrement} label="Quitar uno">
        <Minus size={16} color={colors.brand[700]} strokeWidth={2.5} />
      </StepButton>
      <Text variant="subtitle" className="w-6 text-center text-foreground">
        {qty}
      </Text>
      <StepButton onPress={onIncrement} label="Agregar uno" disabled={atMax}>
        <Plus size={16} color={atMax ? colors.mutedForeground : colors.brand[700]} strokeWidth={2.5} />
      </StepButton>
    </View>
  );
}

function StepButton({
  children,
  onPress,
  label,
  disabled = false,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className="h-8 w-8 items-center justify-center rounded-full border border-border bg-card"
      style={({ pressed }) => ({ opacity: disabled ? 0.35 : pressed ? 0.7 : 1 })}
    >
      {children}
    </Pressable>
  );
}
