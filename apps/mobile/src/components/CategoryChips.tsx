/**
 * Fila horizontal de chips de categoría. El chip activo se pinta en navy de
 * marca; los inactivos en brand-50 con texto brand-700. Scroll sin barra.
 */
import { ScrollView, Pressable } from 'react-native';
import { Text } from '@/ui/Text';
import { colors, fonts } from '@/ui/theme';

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
            className={`h-9 items-center justify-center rounded-full px-4 ${
              active ? 'bg-brand-700' : 'bg-brand-50'
            }`}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: active ? colors.white : colors.brand[700],
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
