import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { makeCrud } from '../../lib/crud';
import { crudRouter } from '../../lib/router';
import { CreateApplicationSchema, UpdateApplicationSchema } from '@caserita/validations';
import { getApplications } from '../../controllers/delivery/deliveryApplications.controller';

const crud = makeCrud(prisma.delivery_applications, CreateApplicationSchema, UpdateApplicationSchema, {
  transform: (data) => ({
    ...data,
    ...(data.vacancy_id !== undefined ? { vacancy_id: BigInt(data.vacancy_id as number) } : {}),
    ...(data.courier_id !== undefined ? { courier_id: BigInt(data.courier_id as number) } : {}),
    ...(data.state_id !== undefined
      ? { state_id: data.state_id ? BigInt(data.state_id as number) : null }
      : {}),
  }),
});

export const deliveryApplicationsRouter = Router();

// Lista con lógica propia: filtra por store_id resolviendo sus vacantes.
deliveryApplicationsRouter.get('/', getApplications);

// CRUD genérico para el resto de operaciones
deliveryApplicationsRouter.use('/', crudRouter(crud));
