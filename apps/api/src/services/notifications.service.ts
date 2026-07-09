import type { Prisma } from '@prisma/client';
import * as notificationsRepo from '../repositories/notifications.repository';
import * as favoritesRepo from '../repositories/favorites.repository';

export const notificationsService = {
  /** Buzón del usuario: últimos avisos, más recientes primero. */
  async list(userId: bigint) {
    return notificationsRepo.listByUser(userId);
  },

  /** Conteo de no leídas (para el badge de la campana). */
  async unreadCount(userId: bigint) {
    return notificationsRepo.countUnread(userId);
  },

  async markRead(userId: bigint, id: bigint) {
    await notificationsRepo.markRead(userId, id);
  },

  async markAllRead(userId: bigint) {
    await notificationsRepo.markAllRead(userId);
  },

  /**
   * Fan-out: crea un aviso en el buzón de cada usuario que tiene la tienda como
   * favorita. Pensado para llamarse "fire-and-forget" desde flujos que no deben
   * fallar si el aviso falla (p.ej. crear una promoción). Devuelve cuántos avisos
   * se crearon (0 si nadie sigue la tienda).
   */
  async notifyStoreFavorites(
    storeId: bigint,
    aviso: { title: string; body: string; type: string; metadata?: Prisma.InputJsonValue },
  ): Promise<number> {
    const userIds = await favoritesRepo.listUserIdsByStore(storeId);
    return notificationsRepo.createForUsers(userIds, aviso);
  },
};
