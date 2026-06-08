import { createStoreSchema, updateStoreSchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const fkFields = ['owner_id', 'category_id', 'region_id', 'commune_id'] as const;

const crud = makeCrud(prisma.stores, createStoreSchema, updateStoreSchema, {
  transform: (data) => {
    const out = { ...data };
    for (const field of fkFields) {
      if (out[field] !== undefined) out[field] = BigInt(out[field] as number);
    }
    return out;
  },
});

export const storesRouter = crudRouter(crud);
