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
  users?: {
    name: string | null;
    email: string;
  };
  delivery_vacancies?: {
    description: string | null;
  };
}

export interface CourierRating {
  id: Id;
  courier_id: Id;
  store_id: Id;
  stars: number;
  comment: string | null;
  created_at: string;
  users?: {
    name: string | null;
  };
}

/** Repartidor disponible (usuario con rol delivery) que la tienda visualiza. */
export interface AvailableCourier {
  id: Id;
  name: string | null;
  email: string;
  phone: string | null;
}
