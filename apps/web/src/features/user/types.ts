import type { Id } from '@/shared/api/types';

/** Usuario titular del comercio (GET /api/users). */
export interface User {
  id: Id;
  email: string;
  name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string | null;
}
