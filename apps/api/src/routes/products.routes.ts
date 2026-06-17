import { Router, type Request, type Response } from 'express';
import { Prisma } from '@prisma/client';
import { createProductSchema, updateProductSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { getPagination } from '../lib/http';

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

/**
 * List de productos con filtros (search/featured/lowStock/sort). Reemplaza al
 * list genérico solo para productos; el resto del CRUD se reusa de `makeCrud`.
 * Mantiene el shape { data, page, limit, total } y el soft delete.
 */
async function list(req: Request, res: Response): Promise<void> {
  const { skip, take, page, limit } = getPagination(req.query);
  const { search, featured, lowStock, sort } = req.query;

  const where: Prisma.productsWhereInput = { deleted_at: null };

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

export const productsRouter = Router();
productsRouter.get('/', list);
productsRouter.get('/:id', crud.getById);
productsRouter.post('/', crud.create);
productsRouter.put('/:id', crud.update);
productsRouter.delete('/:id', crud.remove);
