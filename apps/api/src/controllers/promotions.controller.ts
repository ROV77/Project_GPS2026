import { Request, Response } from 'express';
import type { CreatePromotionInput, UpdatePromotionInput } from '@caserita/validations';
import { promotionsService } from '../services/promotions.service';
import { parseBigIntId } from '../lib/http';

/**
 * Traduce HTTP ↔ service. No lleva try/catch: Express 5 reenvía los rechazos de
 * promesas (incluidos los HttpError del service) al errorHandler global.
 */

export const listPromotions = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  res.json(await promotionsService.list(storeId));
};

export const createPromotion = async (_req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const data = await promotionsService.create(storeId, res.locals.body as CreatePromotionInput);
  res.status(201).json(data);
};

export const updatePromotion = async (req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  const data = await promotionsService.update(storeId, id, res.locals.body as UpdatePromotionInput);
  res.json(data);
};

export const deletePromotion = async (req: Request, res: Response) => {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  await promotionsService.remove(storeId, id);
  res.status(204).send();
};
