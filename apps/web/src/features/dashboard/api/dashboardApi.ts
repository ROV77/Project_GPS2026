import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';

/** Métricas agregadas de la tienda (GET /api/stores/:id/stats). */
export interface StoreStats {
  product_count: number;
  total_stock: number;
  review_count: number;
  avg_rating: number;
}

export const dashboardApi = {
  stats: (storeId: Id) =>
    api.get<StoreStats>(`/stores/${storeId}/stats`).then((r) => r.data),
};
