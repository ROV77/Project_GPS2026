import { Router } from 'express';
import { validateBody } from '../../middlewares/validate';
import { CreateCourierRatingSchema, UpdateCourierRatingSchema } from '@caserita/validations';
import {
  getRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
} from '../../controllers/delivery/courierRatings.controller';

export const courierRatingsRouter = Router();

courierRatingsRouter.get('/', getRatings);
courierRatingsRouter.get('/:id', getRatingById);
courierRatingsRouter.post('/', validateBody(CreateCourierRatingSchema), createRating);
courierRatingsRouter.put('/:id', validateBody(UpdateCourierRatingSchema), updateRating);
courierRatingsRouter.delete('/:id', deleteRating);
