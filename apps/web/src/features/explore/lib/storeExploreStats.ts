import type { PublicStore } from '../types';

export interface ExploreStoreStats {
  total: number;
  openNow: number;
  verified: number;
}

export function computeExploreStoreStats(stores: PublicStore[]): ExploreStoreStats {
  return {
    total: stores.length,
    openNow: stores.filter((s) => s.status === 'open' || s.status === 'closing_soon').length,
    verified: stores.filter((s) => s.verified).length,
  };
}
