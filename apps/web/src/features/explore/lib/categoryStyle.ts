/** Colores planos y apagados por rubro para tarjetas públicas. */
export interface CategoryCardStyle {
  header: string;
  border: string;
  pill: string;
}

const RULES: Array<{ match: RegExp; style: CategoryCardStyle }> = [
  {
    match: /comida|restaurant|cocina|gastro|sushi|pizza/,
    style: {
      header: 'bg-orange-950/70',
      border: 'hover:border-orange-900/40',
      pill: 'bg-orange-950/40 text-orange-200/90',
    },
  },
  {
    match: /panader|pasteler|reposter/,
    style: {
      header: 'bg-amber-950/60',
      border: 'hover:border-amber-900/40',
      pill: 'bg-amber-950/40 text-amber-200/90',
    },
  },
  {
    match: /verduler|fruter|feria|organic/,
    style: {
      header: 'bg-emerald-950/60',
      border: 'hover:border-emerald-900/40',
      pill: 'bg-emerald-950/40 text-emerald-200/90',
    },
  },
  {
    match: /almac|minimarket|abarrote|bazar|botiller/,
    style: {
      header: 'bg-sky-950/60',
      border: 'hover:border-sky-900/40',
      pill: 'bg-sky-950/40 text-sky-200/90',
    },
  },
  {
    match: /carnicer|poll|pesc/,
    style: {
      header: 'bg-red-950/60',
      border: 'hover:border-red-900/40',
      pill: 'bg-red-950/40 text-red-200/90',
    },
  },
  {
    match: /ropa|vestuario|moda|calzado|zapat/,
    style: {
      header: 'bg-purple-950/60',
      border: 'hover:border-purple-900/40',
      pill: 'bg-purple-950/40 text-purple-200/90',
    },
  },
  {
    match: /ferreter|construc|herramient/,
    style: {
      header: 'bg-slate-700/80',
      border: 'hover:border-slate-500/40',
      pill: 'bg-slate-800/60 text-slate-300',
    },
  },
  {
    match: /belleza|peluquer|estetic|cosmetic/,
    style: {
      header: 'bg-pink-950/60',
      border: 'hover:border-pink-900/40',
      pill: 'bg-pink-950/40 text-pink-200/90',
    },
  },
];

const FALLBACK: CategoryCardStyle = {
  header: 'bg-brand-950/60',
  border: 'hover:border-brand-800/40',
  pill: 'bg-brand-950/40 text-brand-200/90',
};

export function getCategoryCardStyle(categoryName: string | null | undefined): CategoryCardStyle {
  if (!categoryName) return FALLBACK;
  const normalized = categoryName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return RULES.find((r) => r.match.test(normalized))?.style ?? FALLBACK;
}
