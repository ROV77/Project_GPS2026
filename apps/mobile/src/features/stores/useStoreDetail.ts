/**
 * Hook de datos para el DETALLE de una tienda: la ficha (Store) + su catálogo
 * (Product[], con sus promociones vigentes). Espejo de `useStores` (useState/
 * useEffect, sin react-query) para mantener las dependencias al mínimo y ser
 * coherente con el resto del mobile.
 *
 * `initialStore` permite hidratar la ficha al instante desde los params de
 * navegación (Home / mapa ya tienen el objeto Store), evitando el parpadeo:
 * se pinta de inmediato y se refetchea en segundo plano por si cambió. Un
 * deep-link directo (sin initialStore) funciona igual: carga todo desde la API.
 *
 * Expone dos recargas:
 *  - `reload()`  → con skeleton (botón "Reintentar", carga inicial).
 *  - `refresh()` → silenciosa (pull-to-refresh y al volver a enfocar la pantalla),
 *    para traer promociones/stock nuevos sin recargar la app entera.
 */
import { useCallback, useEffect, useState } from 'react';
import { getStoreById, getStoreProducts } from './api';
import type { Product, Store } from './types';

interface UseStoreDetailState {
  store: Store | null;
  products: Product[];
  loading: boolean; // primera carga (o reintento) → skeletons
  refreshing: boolean; // pull-to-refresh → spinner del RefreshControl
  error: boolean;
  reload: () => void; // recarga con skeleton (botón "Reintentar")
  refresh: () => Promise<void>; // recarga silenciosa (foco / pull-to-refresh)
}

export function useStoreDetail(
  id: string,
  initialStore?: Store | null,
): UseStoreDetailState {
  const [store, setStore] = useState<Store | null>(initialStore ?? null);
  const [products, setProducts] = useState<Product[]>([]);
  // Si ya tenemos la ficha por params, no mostramos skeleton de la ficha; el
  // catálogo se carga igual, pero la pantalla ya se ve poblada.
  const [loading, setLoading] = useState(!initialStore);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        // Ficha y catálogo (con promociones) en paralelo.
        const [storeData, productsData] = await Promise.all([
          getStoreById(id),
          getStoreProducts(id),
        ]);
        setStore(storeData);
        setProducts(productsData);
      } catch (err) {
        console.error('[useStoreDetail] Error al cargar el detalle:', err);
        // Un refresh silencioso que falla no rompe la pantalla ya poblada.
        if (mode === 'initial') setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  return {
    store,
    products,
    loading,
    refreshing,
    error,
    reload: () => load('initial'),
    refresh: () => load('refresh'),
  };
}
