/**
 * Barra de búsqueda minimalista: card blanca, borde fino slate, ícono lineal.
 * Controlada desde la pantalla (value / onChangeText).
 */
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors, fonts } from '@/ui/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar tiendas',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="h-12 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3">
      <Search size={20} color={colors.mutedForeground} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="search"
        className="flex-1"
        style={{ fontFamily: fonts.regular, fontSize: 15, color: colors.foreground }}
      />
    </View>
  );
}
