/**
 * Estado de sesión (zustand). Fuente de verdad REACTIVA del usuario logueado.
 *
 * El JWT NO vive aquí: sigue en expo-secure-store (cifrado) y lo adjunta el
 * interceptor de axios (shared/api/client.ts). Este store solo guarda el perfil
 * y el estado para que la UI reaccione a login/logout.
 *
 * Accesible fuera de React vía useSession.getState() (lo usa el interceptor 401).
 */
import { create } from 'zustand';
import { getToken, setToken, deleteToken } from '@/shared/lib/secureToken';
import { getMe, becomeCourier, quitCourier } from './api';
import type { Profile, SessionStoreInfo } from './types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  user: Profile | null;
  store: SessionStoreInfo | null;
  status: Status;
  /** Guarda token + hidrata el perfil. Se llama tras login/registro exitoso. */
  signIn: (token: string) => Promise<void>;
  /** Refresca el perfil en memoria (p.ej. tras sumar el rol repartidor). */
  setSession: (user: Profile, store: SessionStoreInfo | null) => void;
  /** Lee el token guardado y, si existe, hidrata el perfil con GET /auth/me. */
  hydrate: () => Promise<void>;
  /** Cierra sesión: borra el token y vuelve a estado anónimo. */
  logout: () => Promise<void>;
}

export const useSession = create<SessionState & { becomeCourier: () => Promise<void>, quitCourier: () => Promise<void> }>((set, get) => ({
  user: null,
  store: null,
  status: 'loading',

  signIn: async (token) => {
    await setToken(token);
    await get().hydrate();
  },

  setSession: (user, store) => set({ user, store, status: 'authenticated' }),

  hydrate: async () => {
    const token = await getToken();
    if (!token) {
      set({ user: null, store: null, status: 'anonymous' });
      return;
    }
    try {
      const { user, store } = await getMe();
      // Salvaguarda: si el perfil hidratado resulta ser de tienda (rol `seller`),
      // no se le permite usar la app mobile. Se borra el token y se queda
      // anónimo (fuerza a logearse de nuevo, donde el flujo de login ya bloquea).
      if (user.roles.includes('seller')) {
        await deleteToken();
        set({ user: null, store: null, status: 'anonymous' });
        return;
      }
      set({ user, store, status: 'authenticated' });
    } catch {
      await deleteToken();
      set({ user: null, store: null, status: 'anonymous' });
    }
  },

  logout: async () => {
    await deleteToken();
    set({ user: null, store: null, status: 'anonymous' });
  },

  becomeCourier: async () => {
    try {
      const { user, store } = await becomeCourier();
      set({ user, store, status: 'authenticated' });
    } catch (e) {
      console.error('Failed to become courier', e);
      throw e;
    }
  },

  quitCourier: async () => {
    try {
      const { user, store } = await quitCourier();
      set({ user, store, status: 'authenticated' });
    } catch (e) {
      console.error('Failed to quit courier', e);
      throw e;
    }
  },
}));
