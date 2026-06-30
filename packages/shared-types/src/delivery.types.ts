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
  users?: {
    name: string | null;
    email: string;
  };
  delivery_vacancies?: {
    description: string | null;
  };
}

export interface CourierRating {
  id: string;
  courier_id: string;
  store_id: string;
  stars: number | null;
  comment: string | null;
  created_at: Date;
  users?: {
    name: string | null;
  };
}

// Los tipos de entrada (CreateVacancyInput, CreateApplicationInput,
// CreateCourierRatingInput) viven en @caserita/validations, inferidos de sus
// schemas Zod (z.infer). No se duplican aquí: una sola fuente de verdad.
