import { useQuery } from '@tanstack/react-query';
import { exploreApi } from '../api/exploreApi';
import type { StoreSearchParams } from '../types';

const KEY = 'public-stores';

export function usePublicStores(params: StoreSearchParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => exploreApi.searchStores({ ...params, limit: 50 }),
  });
}

export function usePublicStore(id: string | undefined) {
  return useQuery({
    queryKey: ['public-store', id],
    queryFn: () => exploreApi.getStore(id!),
    enabled: Boolean(id),
  });
}

export function usePublicStoreProducts(id: string | undefined) {
  return useQuery({
    queryKey: ['public-store-products', id],
    queryFn: () => exploreApi.getStoreProducts(id!),
    enabled: Boolean(id),
  });
}
