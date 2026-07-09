import type { Id } from '@/shared/api/types';

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
  metadata?: { address?: string | null; street?: string | null; number?: string | null } | null;
  verified?: boolean;
}

export interface DaySchedule {
  id: string;
  store_id: string;
  day_of_week: number;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
}

export const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

