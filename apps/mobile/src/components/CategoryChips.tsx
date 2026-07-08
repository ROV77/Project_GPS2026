/**
 * Fila horizontal de chips de categoría. El chip activo se pinta en navy de
 * marca; los inactivos en brand-50 con texto brand-700. Scroll sin barra.
 */
import { ScrollView, Pressable } from 'react-native';
import { Text } from '@/ui/Text';
import { fonts, useThemeColors } from '@/ui/theme';

export interface Category {
  id: string | null; // null = "Todos"
  name: string;
}

export function CategoryChips({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const colors = useThemeColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {categories.map((cat) => {
        const active = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id ?? 'all'}
            onPress={() => onSelect(cat.id)}
            style={{
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9999,
              paddingHorizontal: 16,
              backgroundColor: active ? colors.card : colors.brand[700],
              borderWidth: active ? 1 : 0,
              borderColor: active ? colors.brand[500] : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: active ? colors.brand[500] : colors.white,
              }}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
