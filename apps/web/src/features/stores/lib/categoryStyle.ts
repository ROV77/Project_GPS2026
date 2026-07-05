import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  Croissant,
  Shirt,
  ShoppingBasket,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

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

const FALLBACK: CategoryStyle = { Icon: Store, color: '#3f66a8' };

/** Misma lógica que la app móvil: ícono y color según el nombre de categoría. */
export function getCategoryStyle(categoryName: string | null | undefined): CategoryStyle {
  if (!categoryName) return FALLBACK;
  const normalized = categoryName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return RULES.find((r) => r.match.test(normalized))?.style ?? FALLBACK;
}
