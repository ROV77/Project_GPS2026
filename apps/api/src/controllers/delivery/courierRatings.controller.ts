import { Request, Response } from 'express';
import { courierRatingsService } from '../../services/delivery/courierRatings.service';

export const getRatings = async (req: Request, res: Response) => {
  const { store_id, courier_id, page, limit } = req.query;
  const data = await courierRatingsService.getAllRatings({
    store_id: store_id as string | undefined,
    courier_id: courier_id as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(data);
};

export const getRatingById = async (req: Request, res: Response) => {
  const data = await courierRatingsService.getRatingById(req.params.id as string);
  if (!data) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(data);
};

export const createRating = async (_req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await courierRatingsService.createRating(input);
  res.status(201).json(data);
};

export const updateRating = async (req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await courierRatingsService.updateRating(req.params.id as string, input);
  res.json(data);
};

export const deleteRating = async (req: Request, res: Response) => {
  await courierRatingsService.deleteRating(req.params.id as string);
  res.status(204).send();
};
