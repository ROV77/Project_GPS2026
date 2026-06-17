import { api } from '@/shared/api/client';
import type { LoginInput } from '@caserita/validations';
import type { AuthUser } from '../stores/authStore';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (data: LoginInput) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
};
