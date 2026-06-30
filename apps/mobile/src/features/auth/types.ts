/**
 * Tipos del dominio "auth", alineados con la API:
 *  - POST /api/auth/login | /register-customer | /register-courier
 *      → { token, user: AuthUser }
 *  - GET  /api/auth/me  (y POST /become-courier) → { user: Profile, store }
 *
 * Recordatorio: la API serializa los BigInt como STRING, por eso los `id`
 * (y las fechas) llegan como `string`.
 */

/** Datos públicos que devuelve login/register (mínimos para la sesión). */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
}

/** Perfil completo de GET /auth/me (sin password_hash). */
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  roles: string[];
}

/** Tienda del usuario (solo vendedores la tienen); shape mínimo para la cuenta. */
export interface SessionStoreInfo {
  id: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: Profile;
  store: SessionStoreInfo | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}
