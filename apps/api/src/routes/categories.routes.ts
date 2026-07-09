import { createCategorySchema, updateCategorySchema } from '@caserita/validations';
import { prisma } from '../config/prisma';
import { makeCrud } from '../lib/crud';
import { crudRouter } from '../lib/router';

const crud = makeCrud(prisma.categories, createCategorySchema, updateCategorySchema);

export const categoriesRouter = crudRouter(crud);
