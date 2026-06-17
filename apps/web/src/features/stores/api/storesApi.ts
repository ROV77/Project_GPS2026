import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';
import type { UpdateStoreInput } from '@caserita/validations';
import type { Store } from '../types';

export const storesApi = {
  // Una cuenta = una sola tienda. La obtiene del usuario logueado vía /auth/me
  // (el backend devuelve { user, store }).
  getMine: () =>
    api.get<{ store: Store | null }>('/auth/me').then((r) => r.data.store),

  update: ({ id, data }: { id: Id; data: UpdateStoreInput }) =>
    api.put<Store>(`/stores/${id}`, data).then((r) => r.data),
};
