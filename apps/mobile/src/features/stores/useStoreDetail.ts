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
 * Expone tres recargas, según qué indicador visual muestran:
 *  - `reload()`        → con skeleton (carga inicial / botón "Reintentar").
 *  - `refresh()`       → con el spinner del RefreshControl (pull-to-refresh MANUAL).
 *  - `silentRefresh()` → SIN indicador visible (al volver a enfocar la pantalla),
 *    para traer promociones/stock nuevos sin molestar al usuario con un spinner.
 *
 * Las tres funciones son estables (useCallback) para no re-disparar efectos que
 * dependan de ellas en cada render (ver useFocusEffect en store/[id].tsx).
 */
import { useCallback, useEffect, useState } from 'react';
import { getStoreById, getStoreProducts } from './api';
import type { Product, Store } from './types';

type LoadMode = 'initial' | 'refresh' | 'silent';

interface UseStoreDetailState {
  store: Store | null;
  products: Product[];
  loading: boolean; // primera carga (o reintento) → skeletons
  refreshing: boolean; // pull-to-refresh MANUAL → spinner del RefreshControl
  error: boolean;
  reload: () => Promise<void>; // recarga con skeleton (botón "Reintentar")
  refresh: () => Promise<void>; // pull-to-refresh manual (muestra spinner)
  silentRefresh: () => Promise<void>; // recarga en segundo plano (sin spinner)
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
    async (mode: LoadMode) => {
      // 'silent' no enciende ningún indicador: recarga invisible en segundo plano.
      if (mode === 'initial') setLoading(true);
      else if (mode === 'refresh') setRefreshing(true);
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
        // Un refresh (manual o silencioso) que falla no rompe la pantalla ya poblada.
        if (mode === 'initial') setError(true);
      } finally {
        if (mode === 'initial') setLoading(false);
        else if (mode === 'refresh') setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  // Referencias estables: solo cambian si cambia `id` (no en cada render).
  const reload = useCallback(() => load('initial'), [load]);
  const refresh = useCallback(() => load('refresh'), [load]);
  const silentRefresh = useCallback(() => load('silent'), [load]);

  return { store, products, loading, refreshing, error, reload, refresh, silentRefresh };
}
