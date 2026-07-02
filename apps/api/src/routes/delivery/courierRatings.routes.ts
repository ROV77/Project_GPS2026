import { prisma } from '../../config/prisma';
import { makeCrud } from '../../lib/crud';
import { crudRouter } from '../../lib/router';
import { CreateCourierRatingSchema, UpdateCourierRatingSchema } from '@caserita/validations';

const crud = makeCrud(prisma.courier_ratings, CreateCourierRatingSchema, UpdateCourierRatingSchema, {
  transform: (data) => ({
    ...data,
    ...(data.courier_id !== undefined ? { courier_id: BigInt(data.courier_id as number) } : {}),
    ...(data.store_id !== undefined ? { store_id: BigInt(data.store_id as number) } : {}),
  }),
});

export const courierRatingsRouter = crudRouter(crud);
