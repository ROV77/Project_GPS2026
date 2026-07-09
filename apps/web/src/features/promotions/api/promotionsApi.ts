import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
} from '@caserita/validations';
import type { Promotion } from '../types';

/**
 * Funciones puras de acceso a /api/promotions (mismo patrón que productsApi).
 * Solo hacen la llamada; los hooks de TanStack Query las usan.
 */
export const promotionsApi = {
  list: () => api.get<Promotion[]>('/promotions').then((r) => r.data),

  create: (data: CreatePromotionInput) =>
    api.post<Promotion>('/promotions', data).then((r) => r.data),

  update: ({ id, data }: { id: Id; data: UpdatePromotionInput }) =>
    api.put<Promotion>(`/promotions/${id}`, data).then((r) => r.data),

  remove: (id: Id) => api.delete(`/promotions/${id}`).then(() => id),
};
