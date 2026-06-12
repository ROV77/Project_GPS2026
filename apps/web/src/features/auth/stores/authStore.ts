import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Estado de sesión (global → vive en zustand, no en TanStack Query).
 *
 * IMPORTANTE: hoy la autenticación es SIMULADA. La API todavía no expone /auth
 * (no hay login, las contraseñas no se hashean). `login()` acepta cualquier
 * credencial y guarda un token ficticio. Cuando exista el endpoint real, solo
 * hay que cambiar el cuerpo de `login()` por una llamada a la API y guardar el
 * JWT devuelto; el resto del panel (ProtectedRoute, AdminLayout) no cambia.
 */
export interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (email) =>
        set({
          token: 'mock-token',
          user: { name: email.split('@')[0] || 'Usuario', email },
        }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'caserita-auth',
      // Persistimos solo los datos, no las acciones.
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
