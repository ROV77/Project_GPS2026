import { Request, Response } from 'express';
import { deliveryApplicationsService } from '../../services/delivery/deliveryApplications.service';

export const getApplications = async (_req: Request, res: Response) => {
  const data = await deliveryApplicationsService.getAllApplications();
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
