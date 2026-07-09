/**
 * Hook de datos para la lista de tiendas. Encapsula carga/estado/error y un
 * `reload()` para el botón "Reintentar". (El mobile no usa react-query todavía;
 * un hook con useState/useEffect mantiene las dependencias al mínimo.)
 */
import { useCallback, useEffect, useState } from 'react';
import { searchStores } from './api';
import type { Store, StoreSearchParams } from './types';

interface UseStoresState {
  stores: Store[];
  loading: boolean; // primera carga (o reintento tras error) → muestra skeletons
  refreshing: boolean; // pull-to-refresh → spinner del RefreshControl
  error: boolean;
  reload: () => void; // recarga "inicial" (botón Reintentar)
  refresh: () => void; // recarga por gesto (RefreshControl)
}

export function useStores(params: StoreSearchParams = {}): UseStoresState {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Serializamos los params para que el efecto reaccione a cambios reales
  // (categoría seleccionada, etc.) sin recrear el objeto en cada render.
  const key = JSON.stringify(params);

  // `mode` decide qué indicador se enciende: el de pantalla completa (skeletons)
  // o el de pull-to-refresh. Así no se solapan en la carga inicial.
  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      setError(false);
      try {
        const result = await searchStores(JSON.parse(key) as StoreSearchParams);
        setStores(result.data);
      } catch (err) {
        console.error('[useStores] Error al cargar tiendas:', err);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [key],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  return {
    stores,
    loading,
    refreshing,
    error,
    reload: () => load('initial'),
    refresh: () => load('refresh'),
  };
}
