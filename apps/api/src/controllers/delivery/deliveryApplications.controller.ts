import { Request, Response } from 'express';
import { getAllApplications } from '../../services/delivery/deliveryApplications.service';

export const getApplications = async (req: Request, res: Response) => {
  const { store_id, vacancy_id, courier_id, page, limit } = req.query;
  const data = await getAllApplications({
    store_id: store_id as string | undefined,
    vacancy_id: vacancy_id as string | undefined,
    courier_id: courier_id as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(data);
};
