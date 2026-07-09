import type { PublicStore } from '../types';

/** Filtro provisional por palabra clave (nombre, descripción, categoría). */
export function filterStoresByKeyword(stores: PublicStore[], q: string): PublicStore[] {
  const term = q.trim().toLowerCase();
  if (!term) return stores;

  return stores.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.description?.toLowerCase().includes(term) ||
      s.category_name?.toLowerCase().includes(term),
  );
}
