/**
 * Llamadas HTTP del dominio "auth". Capa fina sobre el cliente axios
 * compartido (gemelo de features/stores/api.ts). El token se guarda/borra en
 * secure-store fuera de aquí (ver session.store.ts); estas funciones solo hablan
 * con la API.
 */
import { api } from '@/shared/api/client';
import { env } from '@/shared/config/env';
import { getToken } from '@/shared/lib/secureToken';
import type { LoginResponse, MeResponse, RegisterInput } from './types';

/** POST /api/auth/login → { token, user }. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

/** POST /api/auth/register-customer → { token, user } (rol customer). */
export async function registerCustomer(input: RegisterInput): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register-customer', input);
  return data;
}

/** POST /api/auth/register-courier → { token, user } (rol delivery). */
export async function registerCourier(input: RegisterInput): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register-courier', input);
  return data;
}

/** GET /api/auth/me → { user, store } (requiere Bearer token). */
export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/auth/me');
  return data;
}

/** POST /api/auth/become-courier → { user, store } (suma rol delivery). */
export async function becomeCourier(): Promise<MeResponse> {
  const { data } = await api.post<MeResponse>('/auth/become-courier');
  return data;
}

/** POST /api/auth/quit-courier → { user, store } (quita rol delivery). */
export async function quitCourier(): Promise<MeResponse> {
  const { data } = await api.post<MeResponse>('/auth/quit-courier');
  return data;
}

/** PATCH /api/auth/me → { user, store } (actualiza perfil propio: name/phone/avatar_url). */
export async function updateMe(input: {
  name?: string;
  phone?: string;
  avatar_url?: string;
}): Promise<MeResponse> {
  const { data } = await api.patch<MeResponse>('/auth/me', input);
  return data;
}

/**
 * POST /api/uploads/image — sube una imagen local (uri del picker) a Cloudinary.
 *
 * Usa `fetch` nativo y NO axios: con FormData en React Native, axios no setea de
 * forma fiable el boundary de multipart (la request falla a nivel de red). Con
 * fetch, al pasar un FormData, RN pone solo el `Content-Type: multipart/form-data;
 * boundary=…` correcto. El token se adjunta a mano (no pasa por el interceptor).
 */
export async function uploadImage(
  uri: string,
  kind: 'avatar' | 'store_logo' | 'product' = 'avatar',
): Promise<string> {
  const token = await getToken();
  const form = new FormData();
  form.append('file', { uri, name: `${kind}.jpg`, type: 'image/jpeg' } as never);

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/api/uploads/image?kind=${kind}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo subir la imagen.');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
