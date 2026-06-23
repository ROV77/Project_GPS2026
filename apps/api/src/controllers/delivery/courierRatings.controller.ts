import { Request, Response } from 'express';
import { courierRatingsService } from '../../services/delivery/courierRatings.service';

export const getRatings = async (_req: Request, res: Response) => {
  const data = await courierRatingsService.getAllRatings();
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
