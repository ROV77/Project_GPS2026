export type StoreVisualStatus = 'open' | 'closing_soon' | 'closed';

export interface PublicStore {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  store_phone: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  address: string | null;
  address_street: string | null;
  address_number: string | null;
  region_name: string | null;
  commune_name: string | null;
  commune_city: string | null;
  category_name: string | null;
  avg_rating: string | number;
  review_count: number;
  status: StoreVisualStatus;
  color: 'green' | 'yellow' | 'red';
  minutesUntilClose: number | null;
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
  image_url: string | null;
  featured: boolean;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StoreSearchParams {
  region_id?: number;
  commune_id?: number;
  category_id?: number;
  verified_only?: boolean;
  page?: number;
  limit?: number;
  q?: string;
}
