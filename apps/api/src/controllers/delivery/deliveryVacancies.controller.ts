import { Request, Response } from 'express';
import { deliveryVacanciesService } from '../../services/delivery/deliveryVacancies.service';

export const getVacancies = async (_req: Request, res: Response) => {
  const data = await deliveryVacanciesService.getAllVacancies();
  res.json(data);
};

export const getVacancyById = async (req: Request, res: Response) => {
  const data = await deliveryVacanciesService.getVacancyById(req.params.id as string);
  if (!data) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(data);
};

export const createVacancy = async (_req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await deliveryVacanciesService.createVacancy(input);
  res.status(201).json(data);
};

export const updateVacancy = async (req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await deliveryVacanciesService.updateVacancy(req.params.id as string, input);
  res.json(data);
};

export const deleteVacancy = async (req: Request, res: Response) => {
  await deliveryVacanciesService.deleteVacancy(req.params.id as string);
  res.status(204).send();
};
