import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Repositorio del buzón de notificaciones in-app. Cada fila es un aviso dirigido
 * a UN usuario (`user_id`). El fan-out (una promoción → muchos avisos) se hace
 * con createMany en `createForUsers`.
 */

/** Últimos avisos del usuario, más recientes primero. */
export async function listByUser(userId: bigint, limit = 50) {
  return prisma.notifications.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

/** Cuántos avisos sin leer tiene el usuario (para el badge). */
export async function countUnread(userId: bigint): Promise<number> {
  return prisma.notifications.count({
    where: { user_id: userId, is_read: false },
  });
}

/**
 * Marca un aviso como leído. Acota por user_id para que nadie marque avisos
 * ajenos. Devuelve cuántas filas cambiaron (0 = no era suyo o no existe).
 */
export async function markRead(userId: bigint, id: bigint): Promise<number> {
  const result = await prisma.notifications.updateMany({
    where: { id, user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
  return result.count;
}

/** Marca todos los avisos del usuario como leídos. */
export async function markAllRead(userId: bigint): Promise<number> {
  const result = await prisma.notifications.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
  return result.count;
}

/** Crea el mismo aviso para muchos usuarios (fan-out). No hace nada si no hay destinatarios. */
export async function createForUsers(
  userIds: bigint[],
  data: { title: string; body: string; type: string; metadata?: Prisma.InputJsonValue },
): Promise<number> {
  if (userIds.length === 0) return 0;
  const result = await prisma.notifications.createMany({
    data: userIds.map((user_id) => ({
      user_id,
      title: data.title,
      body: data.body,
      type: data.type,
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    })),
  });
  return result.count;
}
