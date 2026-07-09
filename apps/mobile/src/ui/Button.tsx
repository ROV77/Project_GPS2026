/**
 * Botón del sistema de diseño. Variante `primary` (navy de marca) y `secondary`
 * (contorno). Un único acento de color, coherente con el panel web.
 */
import { Pressable, ActivityIndicator } from 'react-native';
import { Text } from './Text';
import { fonts, useThemeColors } from './theme';
import { useThemeStore } from './themeStore';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const secondaryColor = theme === 'dark' ? colors.brand[400] : colors.brand[700];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`h-12 flex-row items-center justify-center rounded-lg px-5 ${
        isPrimary ? 'bg-brand-700' : 'border border-border bg-card'
      }`}
      style={({ pressed }) => ({
        opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        backgroundColor: isPrimary && pressed ? colors.brand[800] : undefined,
      })}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : secondaryColor} />
      ) : (
        <Text
          style={{
            fontFamily: fonts.semibold,
            color: isPrimary ? colors.white : secondaryColor,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
