/**
 * Estado de favoritos (zustand). Fuente de verdad reactiva de qué tiendas marcó
 * el usuario. Guarda tanto el conjunto de IDs (para pintar el corazón en O(1))
 * como la lista de tiendas enriquecidas (para la pantalla "Mis favoritos", sin
 * refetch tras un toggle).
 *
 * Lo hidrata/limpia la sesión (features/auth/session.store) al entrar/salir.
 */
import { create } from 'zustand';
import type { Store } from '@/features/stores/types';
import { getFavoriteStores, addFavorite, removeFavorite } from './api';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface FavoritesState {
  ids: Set<string>;
  stores: Store[];
  status: Status;
  /** Carga favoritos desde el backend. Se llama al autenticar y en pull-to-refresh. */
  hydrate: () => Promise<void>;
  /** ¿La tienda está en favoritos? */
  isFavorite: (storeId: string) => boolean;
  /**
   * Alterna el favorito de forma optimista (actualiza la UI al instante y revierte
   * si la API falla). Recibe el objeto Store completo para poder mostrarlo en la
   * lista sin volver a pedirlo. Devuelve el nuevo estado (true = quedó favorita).
   */
  toggle: (store: Store) => Promise<boolean>;
  /** Limpia el estado (logout). */
  clear: () => void;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  ids: new Set<string>(),
  stores: [],
  status: 'idle',

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const stores = await getFavoriteStores();
      set({ stores, ids: new Set(stores.map((s) => s.id)), status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  isFavorite: (storeId) => get().ids.has(storeId),

  toggle: async (store) => {
    const wasFavorite = get().ids.has(store.id);
    const nextIds = new Set(get().ids);
    const prevStores = get().stores;

    // Actualización optimista.
    if (wasFavorite) {
      nextIds.delete(store.id);
      set({ ids: nextIds, stores: prevStores.filter((s) => s.id !== store.id) });
    } else {
      nextIds.add(store.id);
      set({ ids: nextIds, stores: [store, ...prevStores] });
    }

    try {
      if (wasFavorite) await removeFavorite(store.id);
      else await addFavorite(store.id);
      return !wasFavorite;
    } catch (err) {
      // Revertir al estado previo si la API falla.
      set({ ids: new Set(prevStores.map((s) => s.id)), stores: prevStores });
      throw err;
    }
  },

  clear: () => set({ ids: new Set<string>(), stores: [], status: 'idle' }),
}));
