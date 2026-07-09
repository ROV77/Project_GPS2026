import { useState, useCallback, useEffect } from 'react';
import { getStoreReviews, createReview as apiCreateReview } from './api';
import type { Review } from './types';
import type { CreateReviewInput } from '@caserita/validations';

export const useReviews = (storeId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // TODO: implement pagination if needed, for now just fetch page 1 with limit 20
      const data = await getStoreReviews(storeId, 1, 20);
      setReviews(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (input: CreateReviewInput) => {
    const newReview = await apiCreateReview(storeId, input);
    // Replace if it exists (upsert behavior), or prepend
    setReviews((prev) => {
      const exists = prev.findIndex((r) => r.customer_id === newReview.customer_id);
      if (exists !== -1) {
        const next = [...prev];
        next[exists] = newReview;
        return next;
      }
      return [newReview, ...prev];
    });
    return newReview;
  };

  return {
    reviews,
    loading,
    refreshing,
    error,
    refresh: () => fetchReviews(true),
    submitReview,
  };
};
