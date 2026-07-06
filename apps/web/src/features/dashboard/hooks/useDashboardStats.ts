import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { Id } from '@/shared/api/types';

/**
 * Stats de la tienda. Solo corre cuando ya conocemos el id de la tienda y el
 * plan permite verlas (`enabled`), para no pegarle al endpoint —que en Gratis
 * responde 403— cuando la UI igual está bloqueada.
 */
export function useDashboardStats(storeId: Id | undefined, enabled = true) {
  return useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => dashboardApi.stats(storeId as Id),
    enabled: enabled && !!storeId,
  });
}
