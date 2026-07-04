import { api } from '@/shared/api/client';
import type { Paginated, Id, PageParams } from '@/shared/api/types';
import type {
  CreateVacancyInput, UpdateVacancyInput,
  CreateApplicationInput, UpdateApplicationInput,
} from '@caserita/validations';
import type {
  DeliveryVacancy,
  CourierApplication,
  CourierRating,
} from '../types';

export const vacanciesApi = {
  list: (params: PageParams & { store_id?: string }) => 
    api.get<Paginated<DeliveryVacancy>>('/delivery-vacancies', { params }).then((r) => r.data),
  
  create: (data: CreateVacancyInput) => 
    api.post<DeliveryVacancy>('/delivery-vacancies', data).then((r) => r.data),
  
  update: ({ id, data }: { id: Id; data: UpdateVacancyInput }) =>
    api.put<DeliveryVacancy>(`/delivery-vacancies/${id}`, data).then((r) => r.data),
  
  remove: (id: Id) => api.delete(`/delivery-vacancies/${id}`).then(() => id),
};

export const applicationsApi = {
  list: (params: PageParams & { vacancy_id?: string; store_id?: string; courier_id?: string }) =>
    api.get<Paginated<CourierApplication>>('/delivery-applications', { params }).then((r) => r.data),
  
  create: (data: CreateApplicationInput) =>
    api.post<CourierApplication>('/delivery-applications', data).then((r) => r.data),
  
  update: ({ id, data }: { id: Id; data: UpdateApplicationInput }) =>
    api.put<CourierApplication>(`/delivery-applications/${id}`, data).then((r) => r.data),
};

export const courierRatingsApi = {
  list: (params: PageParams & { store_id?: string; courier_id?: string }) =>
    api.get<Paginated<CourierRating>>('/courier-ratings', { params }).then((r) => r.data),
  
  create: (data: { store_id: number; courier_id: number; stars: number; comment?: string }) =>
    api.post<CourierRating>('/courier-ratings', data).then((r) => r.data),
};
