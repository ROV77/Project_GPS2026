/**
 * Barra de búsqueda minimalista: card blanca, borde fino slate, ícono lineal.
 * Controlada desde la pantalla (value / onChangeText).
 */
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { useThemeColors, fonts } from '@/ui/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar tiendas',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const colors = useThemeColors();
  return (
    <View className="h-12 flex-row items-center gap-2 rounded-xl border border-border bg-card px-4">
      <Search size={22} color={colors.brand[400]} strokeWidth={2.5} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        className="flex-1 text-brand-700 dark:text-white"
        style={{ 
          fontFamily: fonts.semibold, 
          fontSize: 16 
        }}
        selectionColor={colors.brand[400]}
      />
    </View>
  );
}
