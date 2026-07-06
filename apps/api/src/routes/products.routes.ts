import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import { Prisma } from '@prisma/client';
import { createProductSchema, updateProductSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { getPagination, parseBigIntId } from '../lib/http';
import { requireAuth } from '../middlewares/requireAuth';
import { withStore } from '../middlewares/withStore';
import { assertCanAddProduct } from '../services/plan-access.service';

/** Umbral de "stock bajo" para el filtro lowStock y los badges del panel. */
export const LOW_STOCK_THRESHOLD = 5;

const crud = makeCrud(prisma.products, createProductSchema, updateProductSchema, {
  softDelete: true,
  transform: (data) => ({
    ...data,
    ...(data.store_id !== undefined
      ? { store_id: BigInt(data.store_id as number) }
      : {}),
  }),
});

/** Verifica que el producto :id pertenezca a la tienda del usuario. */
async function ownProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const id = parseBigIntId(String(req.params.id));
  const storeId = res.locals.storeId as bigint | null;
  if (id === null) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }
  try {
    if (!storeId) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    const found = await prisma.products.findFirst({
      where: { id, store_id: storeId, deleted_at: null },
      select: { id: true },
    });
    if (!found) {
      res.status(404).json({ error: 'No encontrado' });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * List de productos con filtros (search/featured/lowStock/sort), SIEMPRE
 * acotado a la tienda del usuario. Si aún no tiene tienda, devuelve vacío.
 */
async function list(req: Request, res: Response): Promise<void> {
  const { skip, take, page, limit } = getPagination(req.query);
  const storeId = res.locals.storeId as bigint | null;

  if (!storeId) {
    res.json({ data: [], page, limit, total: 0 });
    return;
  }

  const { search, featured, lowStock, sort } = req.query;
  const where: Prisma.productsWhereInput = {
    deleted_at: null,
    store_id: storeId,
  };

  if (typeof search === 'string' && search.trim()) {
    where.name = { contains: search.trim(), mode: 'insensitive' };
  }
  if (featured === 'true') where.featured = true;
  if (lowStock === 'true') where.stock = { lte: LOW_STOCK_THRESHOLD };

  const orderBy: Prisma.productsOrderByWithRelationInput =
    sort === 'stock_asc'
      ? { stock: 'asc' }
      : sort === 'stock_desc'
        ? { stock: 'desc' }
        : sort === 'price_asc'
          ? { price: 'asc' }
          : sort === 'price_desc'
            ? { price: 'desc' }
            : { id: 'asc' };

  const [data, total] = await Promise.all([
    prisma.products.findMany({ where, skip, take, orderBy }),
    prisma.products.count({ where }),
  ]);

  res.json({ data, page, limit, total });
}

/** Crea un producto forzando el store_id de la tienda del usuario. */
async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const storeId = res.locals.storeId as bigint | null;
  if (!storeId) {
    res.status(400).json({ error: 'No tienes una tienda asociada' });
    return;
  }
  req.body = { ...req.body, store_id: storeId.toString() };
  try {
    // Candado del plan: rechaza con 403 si la tienda alcanzó su tope de
    // productos. Va ANTES de crear; no borra nada retroactivamente.
    await assertCanAddProduct(storeId);
    await crud.create(req, res);
  } catch (error) {
    next(error);
  }
}

export const productsRouter = Router();
productsRouter.use(requireAuth, withStore);
productsRouter.get('/', list);
productsRouter.get('/:id', ownProduct, crud.getById);
productsRouter.post('/', create);
productsRouter.put('/:id', ownProduct, crud.update);
productsRouter.delete('/:id', ownProduct, crud.remove);
