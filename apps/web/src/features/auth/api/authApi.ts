import { api } from '@/shared/api/client';
import type {
  LoginInput,
  RegisterInput,
  RegisterCourierInput,
} from '@caserita/validations';
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
  registerCourier: (data: RegisterCourierInput) =>
    api.post<LoginResponse>('/auth/register-courier', data).then((r) => r.data),
};
