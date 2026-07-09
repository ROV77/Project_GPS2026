import { Request, Response } from 'express';
import {
  findStoresWithRating,
  findStoreByIdWithRating,
  findStoreStats,
  findPublicStoreProducts,
} from '../repositories/store.repository';
import { parseBigIntId } from '../lib/http';

export const searchStores = async (_req: Request, res: Response): Promise<void> => {
  // res.locals.query is populated by the validateQuery middleware
  const { region_id, commune_id, category_id, verified_only, q, page, limit } = res.locals.query as any;

  const result = await findStoresWithRating(
    {
      regionId: region_id,
      communeId: commune_id,
      categoryId: category_id,
      verifiedOnly: verified_only,
      q,
    },
    { page, limit },
  );

  res.json(result);
};

export const getStoreStats = async (req: Request, res: Response): Promise<void> => {
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const stats = await findStoreStats(id);
  res.json(stats);
};

/**
 * GET /stores/:id — ficha enriquecida de una tienda (mismo shape que /search:
 * categoría, comuna, región, rating y estado visual). 404 si no existe.
 * La usa el detalle de tienda en mobile.
 */
export const getStoreDetail = async (req: Request, res: Response): Promise<void> => {
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const store = await findStoreByIdWithRating(id);
  if (!store) {
    res.status(404).json({ error: 'Tienda no encontrada' });
    return;
  }

  res.json(store);
};

/**
 * GET /stores/:id/products — catálogo público de la tienda (sin auth).
 * Complementa al listado privado de /products (acotado al dueño): aquí cualquier
 * cliente puede ver los productos de una tienda para el detalle en mobile.
 */
export const getStoreProducts = async (req: Request, res: Response): Promise<void> => {
  const id = parseBigIntId(String(req.params.id));
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const products = await findPublicStoreProducts(id);
  res.json(products);
};
