import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middlewares/requireAuth';

export const couriersRouter = Router();

/**
 * GET /api/couriers/available — repartidores disponibles: usuarios activos con
 * el rol `delivery`. La tienda solo los visualiza (no publica vacantes).
 */
couriersRouter.get(
  '/available',
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const couriers = await prisma.users.findMany({
        where: {
          deleted_at: null,
          is_active: true,
          user_roles: { some: { roles: { name: 'delivery' } } },
        },
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { name: 'asc' },
      });
      res.json({ data: couriers });
    } catch (error) {
      next(error);
    }
  },
);
