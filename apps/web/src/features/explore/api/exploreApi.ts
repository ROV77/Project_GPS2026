import { publicApi } from '@/shared/api/publicClient';
import type { Paginated, PublicProduct, PublicStore, StoreSearchParams } from '../types';

export const exploreApi = {
  searchStores: (params: StoreSearchParams) =>
    publicApi.get<Paginated<PublicStore>>('/stores/search', { params }).then((r) => r.data),

  getStore: (id: string) =>
    publicApi.get<PublicStore>(`/stores/${id}`).then((r) => r.data),

  getStoreProducts: (id: string) =>
    publicApi.get<PublicProduct[]>(`/stores/${id}/products`).then((r) => r.data),
};
