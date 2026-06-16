import type { Id } from '@/shared/api/types';

export interface DeliveryVacancy {
  id: Id;
  store_id: Id;
  description: string | null;
  state_id: Id | null;
  created_at: string;
}

export interface CourierApplication {
  id: Id;
  vacancy_id: Id;
  courier_id: Id;
  state_id: Id | null;
  applied_at: string;
  // TODO: Agregar datos anidados si el backend los devuelve (ej. nombre del repartidor)
}

export interface CourierRating {
  id: Id;
  courier_id: Id;
  store_id: Id;
  stars: number;
  comment: string | null;
  created_at: string;
}
