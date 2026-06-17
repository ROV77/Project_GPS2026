import type { Id } from '@/shared/api/types';

/** Tienda tal como la devuelve la API (GET /api/stores). */
export interface Store {
  id: Id;
  owner_id: Id;
  name: string;
  description?: string | null;
  category_id?: Id | null;
  region_id?: Id | null;
  commune_id?: Id | null;
  logo_url?: string | null;
  store_phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  verified?: boolean;
}
