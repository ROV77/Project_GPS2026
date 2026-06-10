import { Request, Response, NextFunction } from 'express';
import { deliveryVacanciesService } from '../../services/delivery/deliveryVacancies.service';

export const getVacancies = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await deliveryVacanciesService.getAllVacancies();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getVacancyById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await deliveryVacanciesService.getVacancyById(req.params.id as string);
    if (!data) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createVacancy = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const input = res.locals.body;
    const data = await deliveryVacanciesService.createVacancy(input);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateVacancy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = res.locals.body;
    const data = await deliveryVacanciesService.updateVacancy(req.params.id as string, input);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteVacancy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deliveryVacanciesService.deleteVacancy(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
