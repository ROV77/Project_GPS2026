import { findStoresWithRating, findStoreStats } from '../repositories/store.repository';
import type { StoreFilters, PaginationParams } from '@caserita/shared-types';

export const searchStoresService = async (filters: StoreFilters, pagination: PaginationParams) => {
  // Aquí irá la futura lógica de negocio (ej. validaciones adicionales, envío de eventos, etc.)
  return await findStoresWithRating(filters, pagination);
};

export const getStoreStatsService = async (storeId: bigint) => {
  return await findStoreStats(storeId);
};
