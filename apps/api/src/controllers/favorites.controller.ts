import { Request, Response } from 'express';
import type { AddFavoriteInput } from '@caserita/validations';
import { favoritesService } from '../services/favorites.service';
import { parseBigIntId } from '../lib/http';

/**
 * Traduce HTTP ↔ service. Sin try/catch: Express 5 reenvía los rechazos
 * (incluidos los HttpError del service) al errorHandler global.
 * El usuario autenticado llega en res.locals.userId (lo pone requireAuth).
 */

export const listFavorites = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  res.json(await favoritesService.list(userId));
};

export const addFavorite = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  const { store_id } = res.locals.body as AddFavoriteInput;
  const storeId = parseBigIntId(store_id);
  if (storeId === null) {
    res.status(400).json({ error: 'ID de tienda inválido' });
    return;
  }
  await favoritesService.add(userId, storeId);
  res.status(201).json({ store_id, favorited: true });
};

export const removeFavorite = async (req: Request, res: Response) => {
  const userId = res.locals.userId as bigint;
  const storeId = parseBigIntId(String(req.params.storeId));
  if (storeId === null) {
    res.status(400).json({ error: 'ID de tienda inválido' });
    return;
  }
  await favoritesService.remove(userId, storeId);
  res.status(204).send();
};
