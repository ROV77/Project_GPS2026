export interface CourierApplication {
  id: string;
  vacancy_id: string;
  courier_id: string;
  state_id: string | null;
  applied_at: string;
  delivery_vacancies?: DeliveryVacancy;
}

export interface DeliveryVacancy {
  id: string;
  store_id: string;
  description: string | null;
  state_id: string | null;
  created_at: string;
  stores?: {
    name: string;
    store_phone: string | null;
    logo_url: string | null;
    communes?: { name: string } | null;
    regions?: { name: string } | null;
  };
}

export interface CourierRating {
  id: string;
  courier_id: string;
  store_id: string;
  stars: number | null;
  comment: string | null;
  created_at: string;
}
