/**
 * Estado del buzón de notificaciones (zustand). Guarda la lista de avisos y el
 * conteo de no leídas (para el badge de la campana). Lo hidrata/limpia la sesión
 * al entrar/salir (features/auth/session.store).
 */
import { create } from 'zustand';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from './api';
import type { AppNotification } from './types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface NotificationsState {
  items: AppNotification[];
  unread: number;
  status: Status;
  /** Carga avisos + conteo. Se llama al autenticar y en pull-to-refresh. */
  hydrate: () => Promise<void>;
  /** Solo refresca el contador (barato, para el badge). */
  refreshUnread: () => Promise<void>;
  /** Marca un aviso como leído (optimista). */
  markRead: (id: string) => Promise<void>;
  /** Marca todos como leídos (optimista). */
  markAllRead: () => Promise<void>;
  /** Limpia el estado (logout). */
  clear: () => void;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  items: [],
  unread: 0,
  status: 'idle',

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const items = await getNotifications();
      set({ items, unread: items.filter((n) => !n.is_read).length, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },

  refreshUnread: async () => {
    try {
      const unread = await getUnreadCount();
      set({ unread });
    } catch {
      /* silencioso: el badge no es crítico */
    }
  },

  markRead: async (id) => {
    const current = get().items.find((n) => n.id === id);
    if (!current || current.is_read) return; // ya leído: nada que hacer

    // Optimista.
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unread: Math.max(0, s.unread - 1),
    }));
    try {
      await markNotificationRead(id);
    } catch {
      // Revertir el flag y el contador.
      set((s) => ({
        items: s.items.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
        unread: s.unread + 1,
      }));
    }
  },

  markAllRead: async () => {
    const prev = get().items;
    set({ items: prev.map((n) => ({ ...n, is_read: true })), unread: 0 });
    try {
      await markAllNotificationsRead();
    } catch {
      set({ items: prev, unread: prev.filter((n) => !n.is_read).length });
    }
  },

  clear: () => set({ items: [], unread: 0, status: 'idle' }),
}));
