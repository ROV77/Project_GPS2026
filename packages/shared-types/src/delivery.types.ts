export interface DeliveryVacancy {
  id: string; // BigInt serialized to string
  store_id: string;
  description: string | null;
  state_id: string | null;
  created_at: Date;
}

export interface CourierApplication {
  id: string;
  vacancy_id: string;
  courier_id: string;
  state_id: string | null;
  applied_at: Date;
}

export interface CourierRating {
  id: string;
  courier_id: string;
  store_id: string;
  stars: number | null;
  comment: string | null;
  created_at: Date;
}

export interface CreateVacancyInput {
  store_id: number;
  description?: string;
  state_id?: number;
}

export interface CreateApplicationInput {
  vacancy_id: number;
  courier_id: number;
  state_id?: number;
}

export interface CreateCourierRatingInput {
  courier_id: number;
  store_id: number;
  stars: number;
  comment?: string;
}
