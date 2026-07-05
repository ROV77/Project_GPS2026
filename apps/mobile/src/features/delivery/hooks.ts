import { useState, useEffect } from 'react';
import { getVacancies, getMyApplications, applyToVacancy, getCourierRatings } from './api';
import type { CourierApplication, DeliveryVacancy, CourierRating } from './types';

export function useVacancies() {
  const [data, setData] = useState<DeliveryVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const result = await getVacancies();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVacancies();
  }, []);

  return { data, loading, error, refetch: fetchVacancies };
}

export function useMyApplications(courierId: string | undefined) {
  const [data, setData] = useState<CourierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = async () => {
    if (!courierId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getMyApplications(courierId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, [courierId]);

  return { data, loading, error, refetch: fetchApplications };
}

export function useApplyToVacancy() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (vacancyId: string, courierId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await applyToVacancy(vacancyId, courierId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

export function useCourierRatings(courierId: string | undefined) {
  const [data, setData] = useState<CourierRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!courierId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const result = await getCourierRatings(courierId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    void fetchRatings();
  }, [courierId]);

  const average = data.length > 0 
    ? data.reduce((acc, curr) => acc + (curr.stars ?? 0), 0) / data.length 
    : 0;

  return { data, average, loading, error };
}
