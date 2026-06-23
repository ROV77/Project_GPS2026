/**
 * Llamadas HTTP del dominio "tiendas". Capa fina sobre el cliente axios
 * compartido: ninguna pantalla llama a la API directamente, siempre pasa por aquí.
 */
import { api } from '@/shared/api/client';
import type { Paginated, Store, StoreSearchParams } from './types';

/** GET /api/stores/search — listado público con rating, filtrable. */
export async function searchStores(
  params: StoreSearchParams = {},
): Promise<Paginated<Store>> {
  const { data } = await api.get<Paginated<Store>>('/stores/search', { params });
  return data;
}
