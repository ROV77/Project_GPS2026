import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { parseBigIntId } from '../lib/http';

/**
 * Buzón de notificaciones del usuario autenticado (res.locals.userId, puesto por
 * requireAuth). Sin try/catch: Express 5 reenvía los rechazos al errorHandler.
 */

export const listNotifications = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  res.json(await notificationsService.list(userId));
};

export const getUnreadCount = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  res.json({ count: await notificationsService.unreadCount(userId) });
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  await notificationsService.markRead(userId, id);
  res.status(204).send();
};

export const markAllNotificationsRead = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  await notificationsService.markAllRead(userId);
  res.status(204).send();
};
