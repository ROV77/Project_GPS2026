/**
 * Hook de datos para el DETALLE de una tienda: la ficha (Store) + su catálogo
 * (Product[]). Espejo de `useStores` (useState/useEffect, sin react-query) para
 * mantener las dependencias al mínimo y ser coherente con el resto del mobile.
 *
 * `initialStore` permite hidratar la ficha al instante desde los params de
 * navegación (Home / mapa ya tienen el objeto Store), evitando el parpadeo:
 * se pinta de inmediato y se refetchea en segundo plano por si cambió. Un
 * deep-link directo (sin initialStore) funciona igual: carga todo desde la API.
 */
import { useCallback, useEffect, useState } from 'react';
import { getStoreById, getStoreProducts } from './api';
import type { Product, Store } from './types';

interface UseStoreDetailState {
  store: Store | null;
  products: Product[];
  loading: boolean; // primera carga (o reintento) → skeletons
  error: boolean;
  reload: () => void; // botón "Reintentar"
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
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Ficha y catálogo en paralelo (un solo round-trip percibido).
      const [storeData, productsData] = await Promise.all([
        getStoreById(id),
        getStoreProducts(id),
      ]);
      setStore(storeData);
      setProducts(productsData);
    } catch (err) {
      console.error('[useStoreDetail] Error al cargar el detalle:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { store, products, loading, error, reload: load };
}
