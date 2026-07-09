export interface ReviewUser {
  name: string | null;
  avatar_url: string | null;
}

export interface Review {
  id: string;
  store_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: ReviewUser;
}
