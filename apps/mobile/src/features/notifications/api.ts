/**
 * Llamadas HTTP del buzón de notificaciones. Todas requieren sesión (el
 * interceptor de axios adjunta el JWT).
 */
import { api } from '@/shared/api/client';
import type { AppNotification } from './types';

/** GET /api/notifications — últimos avisos del usuario. */
export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/notifications');
  return data;
}

/** GET /api/notifications/unread-count — cuántos avisos sin leer (para el badge). */
export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

/** PATCH /api/notifications/:id/read — marca un aviso como leído. */
export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

/** PATCH /api/notifications/read-all — marca todos como leídos. */
export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
