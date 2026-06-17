import { api } from '@/shared/api/client';
import type { LoginInput, RegisterInput } from '@caserita/validations';
import type { AuthUser } from '../stores/authStore';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (data: LoginInput) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterInput) =>
    api.post<LoginResponse>('/auth/register', data).then((r) => r.data),
};
