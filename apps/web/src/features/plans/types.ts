import type { Id } from '@/shared/api/types';

/** Plan de suscripción (GET /api/plans). */
export interface Plan {
  id: Id;
  name: string;
  price: number | string;
  billing_period: string;
  description?: string | null;
  max_products?: number | null;
  features?: string[] | null;
  is_active?: boolean;
}
