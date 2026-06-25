import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';
import type { User } from '../types';

export interface UpdateAccountData {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

export const userApi = {
  // El titular es el usuario logueado: lo obtiene de /auth/me
  // (el backend devuelve { user, store }).
  getMine: () =>
    api.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  update: ({ id, data }: { id: Id; data: UpdateAccountData }) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),
};
