import { api } from '@/shared/api/client';
import type { Paginated, Id } from '@/shared/api/types';
import type { User } from '../types';

export interface UpdateAccountData {
  name?: string;
  phone?: string;
}

export const userApi = {
  // Placeholder: como la auth es simulada y aún no hay vínculo cuenta→usuario,
  // tomamos el primer usuario como "el titular". Cuando exista /auth real, esto
  // se reemplaza por GET /api/me (o el id del JWT).
  getMine: () =>
    api
      .get<Paginated<User>>('/users', { params: { limit: 1 } })
      .then((r) => r.data.data[0] ?? null),

  update: ({ id, data }: { id: Id; data: UpdateAccountData }) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),
};
