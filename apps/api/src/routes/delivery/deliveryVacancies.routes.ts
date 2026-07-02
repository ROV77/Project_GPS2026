import { prisma } from '../../config/prisma';
import { makeCrud } from '../../lib/crud';
import { crudRouter } from '../../lib/router';
import { CreateVacancySchema, UpdateVacancySchema } from '@caserita/validations';

const crud = makeCrud(prisma.delivery_vacancies, CreateVacancySchema, UpdateVacancySchema, {
  transform: (data) => ({
    ...data,
    ...(data.store_id !== undefined ? { store_id: BigInt(data.store_id as number) } : {}),
    ...(data.state_id !== undefined
      ? { state_id: data.state_id ? BigInt(data.state_id as number) : null }
      : {}),
  }),
});

export const deliveryVacanciesRouter = crudRouter(crud);
