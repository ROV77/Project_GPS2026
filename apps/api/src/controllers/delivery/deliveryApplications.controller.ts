import { Request, Response } from 'express';
import { deliveryApplicationsService } from '../../services/delivery/deliveryApplications.service';

export const getApplications = async (req: Request, res: Response) => {
  const { store_id, vacancy_id, courier_id, page, limit } = req.query;
  const data = await deliveryApplicationsService.getAllApplications({
    store_id: store_id as string | undefined,
    vacancy_id: vacancy_id as string | undefined,
    courier_id: courier_id as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(data);
};

export const getApplicationById = async (req: Request, res: Response) => {
  const data = await deliveryApplicationsService.getApplicationById(req.params.id as string);
  if (!data) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json(data);
};

export const createApplication = async (_req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await deliveryApplicationsService.createApplication(input);
  res.status(201).json(data);
};

export const updateApplication = async (req: Request, res: Response) => {
  const input = res.locals.body;
  const data = await deliveryApplicationsService.updateApplication(req.params.id as string, input);
  res.json(data);
};

export const deleteApplication = async (req: Request, res: Response) => {
  await deliveryApplicationsService.deleteApplication(req.params.id as string);
  res.status(204).send();
};
