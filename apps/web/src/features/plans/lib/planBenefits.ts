import type { Plan } from '../types';

/** Badge de verificado en la app: solo planes de pago (Pro, Premium, etc.). */
export function planShowsVerifiedBadge(plan?: Pick<Plan, 'name' | 'price'> | null): boolean {
  if (!plan) return false;
  return Number(plan.price) > 0;
}
