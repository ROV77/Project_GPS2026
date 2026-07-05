import type { SelectOption } from '@/shared/ui/Select';
import type { PublicStore } from '../types';

function findCategoryLabel(options: SelectOption[], categoryId: string): string | null {
  return options.find((o) => o.value === categoryId)?.label ?? null;
}

export function filterStoresByCategory(
  stores: PublicStore[],
  categoryId: string | null,
  categoryOptions: SelectOption[],
): PublicStore[] {
  if (!categoryId) return stores;

  const label = findCategoryLabel(categoryOptions, categoryId);
  if (!label) return stores;

  return stores.filter((s) => s.category_name === label);
}

export interface CategoryChipItem {
  id: string;
  label: string;
  count: number;
}

/** Categorías con al menos una tienda en el listado actual, ordenadas por cantidad. */
export function computeCategoryChips(
  stores: PublicStore[],
  categoryOptions: SelectOption[],
): CategoryChipItem[] {
  const countByName = new Map<string, number>();

  for (const store of stores) {
    if (!store.category_name) continue;
    countByName.set(store.category_name, (countByName.get(store.category_name) ?? 0) + 1);
  }

  return categoryOptions
    .map((option) => ({
      id: option.value,
      label: option.label,
      count: countByName.get(option.label) ?? 0,
    }))
    .filter((chip) => chip.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
}
