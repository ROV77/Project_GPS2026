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

/**
 * Variante para el mapa Leaflet (WebView): el pin vive en una página HTML plana,
 * donde no se puede renderizar el componente `LucideIcon` de arriba. Por eso acá
 * se emparejan las MISMAS reglas/colores con el SVG crudo (blanco, trazo) de cada
 * ícono lucide correspondiente — copiado de lucide-react-native (ISC), para que
 * mapa y sheet nativo compartan criterio de categoría. Ver LeafletMap.tsx.
 */
const LUCIDE_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"';

function svg(paths: string): string {
  return `<svg ${LUCIDE_ATTRS}>${paths}</svg>`;
}

// Cada entrada usa el mismo orden que RULES; la clave es el ícono lucide.
const SVG_BY_ICON: Record<string, string> = {
  UtensilsCrossed: svg(
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/>' +
      '<path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/>' +
      '<path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',
  ),
  Croissant: svg(
    '<path d="m4.6 13.11 5.79-3.21c1.89-1.05 4.79 1.78 3.71 3.71l-3.22 5.81C8.8 23.16.79 15.23 4.6 13.11Z"/>' +
      '<path d="m10.5 9.5-1-2.29C9.2 6.48 8.8 6 8 6H4.5C2.79 6 2 6.5 2 8.5a7.71 7.71 0 0 0 2 4.83"/>' +
      '<path d="M8 6c0-1.55.24-4-2-4-2 0-2.5 2.17-2.5 4"/>' +
      '<path d="m14.5 13.5 2.29 1c.73.3 1.21.7 1.21 1.5v3.5c0 1.71-.5 2.5-2.5 2.5a7.71 7.71 0 0 1-4.83-2"/>' +
      '<path d="M18 16c1.55 0 4-.24 4 2 0 2-2.17 2.5-4 2.5"/>',
  ),
  Apple: svg(
    '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>' +
      '<path d="M10 2c1 .5 2 2 2 5"/>',
  ),
  ShoppingBasket: svg(
    '<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/>' +
      '<path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/>' +
      '<path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>',
  ),
  Shirt: svg(
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  ),
  Wrench: svg(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  ),
  Sparkles: svg(
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>' +
      '<path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  ),
  Store: svg(
    '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>' +
      '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>' +
      '<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>' +
      '<path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  ),
};

// Map de LucideIcon component → clave string, para reutilizar RULES sin duplicar.
const ICON_NAME = new Map<LucideIcon, string>([
  [UtensilsCrossed, 'UtensilsCrossed'],
  [Croissant, 'Croissant'],
  [Apple, 'Apple'],
  [ShoppingBasket, 'ShoppingBasket'],
  [Shirt, 'Shirt'],
  [Wrench, 'Wrench'],
  [Sparkles, 'Sparkles'],
  [StoreIcon, 'Store'],
]);

export interface CategoryMarker {
  color: string;
  /** SVG crudo del ícono (blanco) para inyectar en el divIcon de Leaflet. */
  svg: string;
}

export function getCategoryMarkerSvg(categoryName: string | null | undefined): CategoryMarker {
  const { Icon, color } = getCategoryStyle(categoryName);
  const name = ICON_NAME.get(Icon) ?? 'Store';
  return { color, svg: SVG_BY_ICON[name] };
}
