/**
 * Llamadas HTTP del dominio "tiendas". Capa fina sobre el cliente axios
 * compartido: ninguna pantalla llama a la API directamente, siempre pasa por aquí.
 */
import { api } from '@/shared/api/client';
import type { Paginated, Product, Store, StoreSearchParams } from './types';

/** GET /api/stores/search — listado público con rating, filtrable. */
export async function searchStores(
  params: StoreSearchParams = {},
): Promise<Paginated<Store>> {
  const { data } = await api.get<Paginated<Store>>('/stores/search', { params });
  return data;
}

/**
 * GET /api/stores/:id — ficha enriquecida de una tienda (mismo shape que
 * /search: categoría, comuna, región, rating, estado). Público, sin login.
 */
export async function getStoreById(id: string): Promise<Store> {
  const { data } = await api.get<Store>(`/stores/${id}`);
  return data;
}

/**
 * GET /api/stores/:id/products — catálogo público de la tienda. El backend
 * devuelve el array directo (no paginado); se tipa así explícitamente.
 */
export async function getStoreProducts(id: string): Promise<Product[]> {
  const { data } = await api.get<Product[]>(`/stores/${id}/products`);
  return data;
}
