import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

/**
 * Resuelve la tienda del usuario autenticado y la deja en res.locals.storeId
 * (BigInt o null). Requiere que requireAuth haya corrido antes. Usado por
 * cualquier ruta que deba acotarse a "la tienda de esta cuenta" (productos,
 * suscripciones...).
 */
export async function withStore(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const store = await prisma.stores.findFirst({
      where: { owner_id: res.locals.userId as bigint },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    res.locals.storeId = store?.id ?? null;
    next();
  } catch (error) {
    next(error);
  }
}
