/**
 * Estilo visual (ícono + color) por rubro de tienda para el mapa.
 *
 * La API entrega solo `category_name` (texto libre cargado por admins), así que
 * el match es por palabra clave sobre el nombre normalizado (sin tildes,
 * minúsculas). Categoría desconocida o null → fallback genérico (ícono tienda,
 * azul de marca). Agregar rubros nuevos = agregar una regla aquí.
 */
import type { LucideIcon } from 'lucide-react-native';
import {
  Apple,
  Croissant,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Store as StoreIcon,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react-native';
import { colors } from '@/ui/theme';

export interface CategoryStyle {
  Icon: LucideIcon;
  color: string;
}

const RULES: Array<{ match: RegExp; style: CategoryStyle }> = [
  { match: /comida|restaurant|cocina|gastro|sushi|pizza/, style: { Icon: UtensilsCrossed, color: '#ea580c' } },
  { match: /panader|pasteler|reposter/, style: { Icon: Croissant, color: '#b45309' } },
  { match: /verduler|fruter|feria|organic/, style: { Icon: Apple, color: '#16a34a' } },
  { match: /almac|minimarket|abarrote|bazar|botiller/, style: { Icon: ShoppingBasket, color: '#2563eb' } },
  { match: /ropa|vestuario|moda|calzado|zapat/, style: { Icon: Shirt, color: '#9333ea' } },
  { match: /ferreter|construc|herramient/, style: { Icon: Wrench, color: '#475569' } },
  { match: /belleza|peluquer|estetic|cosmetic/, style: { Icon: Sparkles, color: '#db2777' } },
];

const FALLBACK: CategoryStyle = { Icon: StoreIcon, color: colors.brand[500] };

export function getCategoryStyle(categoryName: string | null | undefined): CategoryStyle {
  if (!categoryName) return FALLBACK;
  const normalized = categoryName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return RULES.find((r) => r.match.test(normalized))?.style ?? FALLBACK;
}
