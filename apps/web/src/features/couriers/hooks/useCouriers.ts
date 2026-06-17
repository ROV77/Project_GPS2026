import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { vacanciesApi, applicationsApi, courierRatingsApi } from '../api/couriersApi';
import type { PageParams } from '@/shared/api/types';

const VACANCIES_KEY = 'delivery-vacancies';
const APPLICATIONS_KEY = 'delivery-applications';
const RATINGS_KEY = 'courier-ratings';

// --- Vacancies ---

export function useVacancies(params: PageParams & { store_id?: string }) {
  return useQuery({
    queryKey: [VACANCIES_KEY, params],
    queryFn: () => vacanciesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vacanciesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [VACANCIES_KEY] }),
  });
}

export function useUpdateVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vacanciesApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [VACANCIES_KEY] }),
  });
}

export function useDeleteVacancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vacanciesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: [VACANCIES_KEY] }),
  });
}

// --- Applications ---

export function useApplications(params: PageParams & { vacancy_id?: string }) {
  return useQuery({
    queryKey: [APPLICATIONS_KEY, params],
    queryFn: () => applicationsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applicationsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [APPLICATIONS_KEY] }),
  });
}

// --- Ratings ---

export function useCourierRatings(params: PageParams & { store_id?: string }) {
  return useQuery({
    queryKey: [RATINGS_KEY, params],
    queryFn: () => courierRatingsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCourierRating() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: courierRatingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [RATINGS_KEY] }),
  });
}
