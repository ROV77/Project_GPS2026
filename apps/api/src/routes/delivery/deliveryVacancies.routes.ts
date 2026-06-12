import { Router } from 'express';
import { validateBody } from '../../middlewares/validate';
import { CreateVacancySchema, UpdateVacancySchema } from '@caserita/validations';
import {
  getVacancies,
  getVacancyById,
  createVacancy,
  updateVacancy,
  deleteVacancy,
} from '../../controllers/delivery/deliveryVacancies.controller';

export const deliveryVacanciesRouter = Router();

deliveryVacanciesRouter.get('/', getVacancies);
deliveryVacanciesRouter.get('/:id', getVacancyById);
deliveryVacanciesRouter.post('/', validateBody(CreateVacancySchema), createVacancy);
deliveryVacanciesRouter.put('/:id', validateBody(UpdateVacancySchema), updateVacancy);
deliveryVacanciesRouter.delete('/:id', deleteVacancy);
