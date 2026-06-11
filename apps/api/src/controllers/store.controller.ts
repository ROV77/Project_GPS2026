import { Request, Response, NextFunction } from 'express';
import { searchStoresService } from '../services/store.service';

export const searchStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // res.locals.query is populated by the validateQuery middleware
    const { region_id, commune_id, category_id, verified_only, page, limit } = res.locals.query as any;

    const result = await searchStoresService(
      {
        regionId: region_id,
        communeId: commune_id,
        categoryId: category_id,
        verifiedOnly: verified_only,
      },
      { page, limit },
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
