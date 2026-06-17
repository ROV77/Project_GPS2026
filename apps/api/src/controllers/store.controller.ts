import { Request, Response, NextFunction } from 'express';
import { findStoresWithRating, findStoreStats } from '../repositories/store.repository';
import { parseBigIntId } from '../lib/http';

export const searchStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // res.locals.query is populated by the validateQuery middleware
    const { region_id, commune_id, category_id, verified_only, page, limit } = res.locals.query as any;

    const result = await findStoresWithRating(
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

export const getStoreStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseBigIntId(String(req.params.id));
    if (id === null) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const stats = await findStoreStats(id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
