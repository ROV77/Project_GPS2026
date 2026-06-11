import { Request, Response, NextFunction } from 'express';
import { getAllRegionsService, getCommunesByRegionService } from '../services/region.service';

export const getRegions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const regions = await getAllRegionsService();
    res.json(regions);
  } catch (error) {
    next(error);
  }
};

export const getCommunesByRegion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const regionId = Number(req.params.regionId);

    if (!Number.isInteger(regionId) || regionId <= 0) {
      res.status(400).json({ error: 'regionId inválido' });
      return;
    }

    const communes = await getCommunesByRegionService(regionId);
    res.json(communes);
  } catch (error) {
    next(error);
  }
};
