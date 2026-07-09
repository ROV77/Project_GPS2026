import { api } from '@/shared/api/client';
import type { Review } from './types';
import type { Paginated } from '../stores/types';
import type { CreateReviewInput } from '@caserita/validations';

export const getStoreReviews = async (storeId: string, page = 1, limit = 10): Promise<Paginated<Review>> => {
  const { data } = await api.get<Paginated<Review>>(`/stores/${storeId}/reviews`, {
    params: { page, limit },
  });
  return data;
};

export const createReview = async (storeId: string, payload: CreateReviewInput): Promise<Review> => {
  const { data } = await api.post<Review>(`/stores/${storeId}/reviews`, payload);
  return data;
};
