import { Router } from 'express';
import { validateBody } from '../../middlewares/validate';
import { CreateApplicationSchema, UpdateApplicationSchema } from '@caserita/validations';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../../controllers/delivery/deliveryApplications.controller';

export const deliveryApplicationsRouter = Router();

deliveryApplicationsRouter.get('/', getApplications);
deliveryApplicationsRouter.get('/:id', getApplicationById);
deliveryApplicationsRouter.post('/', validateBody(CreateApplicationSchema), createApplication);
deliveryApplicationsRouter.put('/:id', validateBody(UpdateApplicationSchema), updateApplication);
deliveryApplicationsRouter.delete('/:id', deleteApplication);
