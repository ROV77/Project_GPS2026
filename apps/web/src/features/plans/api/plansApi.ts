import { api } from '@/shared/api/client';
import type { Paginated, PageParams } from '@/shared/api/types';
import type { Plan } from '../types';

export const plansApi = {
  list: ({ page, limit }: PageParams) =>
    api
      .get<Paginated<Plan>>('/plans', { params: { page, limit } })
      .then((r) => r.data),
};
