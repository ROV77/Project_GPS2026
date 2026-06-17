import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import type { Id } from '@/shared/api/types';

/** Stats de la tienda. Solo corre cuando ya conocemos el id de la tienda. */
export function useDashboardStats(storeId: Id | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => dashboardApi.stats(storeId as Id),
    enabled: !!storeId,
  });
}
