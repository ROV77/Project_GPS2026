import { api } from '@/shared/api/client';
import type { Paginated, Id } from '@/shared/api/types';
import type { UpdateStoreInput } from '@caserita/validations';
import type { Store, DaySchedule } from '../types';

export const storesApi = {
  // Una cuenta = una sola tienda. Como la auth es simulada y aún no hay vínculo
  // cuenta→tienda, tomamos la primera tienda como "mi tienda" (placeholder hasta
  // que exista /auth real).
  getMine: () =>
    api
      .get<Paginated<Store>>('/stores', { params: { limit: 1 } })
      .then((r) => r.data.data[0] ?? null),

  update: ({ id, data }: { id: Id; data: UpdateStoreInput }) =>
    api.put<Store>(`/stores/${id}`, data).then((r) => r.data),

  getSchedules: (storeId: Id) =>
    api.get<DaySchedule[]>(`/stores/${storeId}/schedules`).then((r) => r.data),

  updateSchedules: ({ storeId, data }: { storeId: Id; data: Omit<DaySchedule, 'id' | 'store_id'>[] }) =>
    api.put<DaySchedule[]>(`/stores/${storeId}/schedules`, data).then((r) => r.data),
};

