import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { plansApi } from '../api/plansApi';
import type { PageParams } from '@/shared/api/types';

export function usePlans(params: PageParams) {
  return useQuery({
    queryKey: ['plans', params],
    queryFn: () => plansApi.list(params),
    placeholderData: keepPreviousData,
  });
}
