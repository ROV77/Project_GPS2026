import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Estado de sesión (global → vive en zustand, no en TanStack Query).
 *
 * La sesión la abre `POST /api/auth/login` (ver features/auth/api/authApi.ts):
 * devuelve un JWT y los datos del usuario, que se guardan con `setSession`. El
 * cliente axios (shared/api/client.ts) adjunta ese token en cada request y, ante
 * un 401, llama a `logout`.
 */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'caserita-auth',
      // Persistimos solo los datos, no las acciones.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
