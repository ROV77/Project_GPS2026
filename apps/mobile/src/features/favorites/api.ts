/**
 * Llamadas HTTP del dominio "favoritos". Todas requieren sesión (el interceptor
 * de axios adjunta el JWT). Capa fina sobre el cliente compartido.
 */
import { api } from '@/shared/api/client';
import type { Store } from '@/features/stores/types';

/** GET /api/favorites — tiendas favoritas del usuario (mismo shape que /stores/search). */
export async function getFavoriteStores(): Promise<Store[]> {
  const { data } = await api.get<Store[]>('/favorites');
  return data;
}

/** POST /api/favorites — marca una tienda como favorita (idempotente). */
export async function addFavorite(storeId: string): Promise<void> {
  await api.post('/favorites', { store_id: storeId });
}

/** DELETE /api/favorites/:storeId — quita una tienda de favoritos (idempotente). */
export async function removeFavorite(storeId: string): Promise<void> {
  await api.delete(`/favorites/${storeId}`);
}
