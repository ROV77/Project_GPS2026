import { createProductSchema, updateProductSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const crud = makeCrud(prisma.products, createProductSchema, updateProductSchema, {
  softDelete: true,
  transform: (data) => ({
    ...data,
    ...(data.store_id !== undefined
      ? { store_id: BigInt(data.store_id as number) }
      : {}),
  }),
});

export const productsRouter = crudRouter(crud);
