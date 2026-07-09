import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notifications.controller';

export const notificationsRouter = Router();

// Buzón del usuario autenticado: todo opera sobre res.locals.userId.
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', listNotifications);
notificationsRouter.get('/unread-count', getUnreadCount);
notificationsRouter.patch('/read-all', markAllNotificationsRead);
notificationsRouter.patch('/:id/read', markNotificationRead);
