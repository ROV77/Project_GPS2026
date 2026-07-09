import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '@/app/queryClient';

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
  roles: string[];
}

/** Ruta de inicio según el rol: los repartidores van a su propio dashboard. */
export function homePathForRoles(roles: string[] | undefined): string {
  return roles?.includes('delivery') ? '/delivery' : '/dashboard';
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
      // Limpia la cache de React Query al entrar una nueva sesión: sin esto, los
      // datos del usuario anterior (perfil, tienda, suscripción) quedan cacheados
      // y se muestran hasta que vence staleTime o se recarga la página.
      setSession: (token, user) => {
        queryClient.clear();
        set({ token, user });
      },
      logout: () => {
        queryClient.clear();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'caserita-auth',
      // Persistimos solo los datos, no las acciones.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
