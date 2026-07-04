import { api } from '@/shared/api/client';
import type { CourierApplication, DeliveryVacancy, CourierRating } from './types';

export async function getVacancies(): Promise<DeliveryVacancy[]> {
  const { data } = await api.get<{ data: DeliveryVacancy[] }>('/delivery-vacancies');
  return data.data;
}

export async function getMyApplications(courierId: string): Promise<CourierApplication[]> {
  const { data } = await api.get<{ data: CourierApplication[] }>('/delivery-applications', {
    params: { courier_id: courierId },
  });
  return data.data;
}

export async function applyToVacancy(vacancyId: string, courierId: string): Promise<CourierApplication> {
  const { data } = await api.post<CourierApplication>('/delivery-applications', {
    vacancy_id: vacancyId,
    courier_id: courierId,
  });
  return data;
}

export async function getCourierRatings(courierId: string): Promise<CourierRating[]> {
  const { data } = await api.get<{ data: CourierRating[] }>('/courier-ratings', {
    params: { courier_id: courierId },
  });
  return data.data;
}
