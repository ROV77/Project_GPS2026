import { Router } from 'express';
import { createPromotionSchema, updatePromotionSchema } from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { withStore } from '../middlewares/withStore';
import { requireFeature } from '../middlewares/requireFeature';
import {
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../controllers/promotions.controller';

export const promotionsRouter = Router();

// Promociones es una función del plan Pro: todo el router exige la capacidad
// (además de sesión y tienda). Gratis recibe 403 incluso al listar.
promotionsRouter.use(requireAuth, withStore, requireFeature('canUsePromotions'));

promotionsRouter.get('/', listPromotions);
promotionsRouter.post('/', validateBody(createPromotionSchema), createPromotion);
promotionsRouter.put('/:id', validateBody(updatePromotionSchema), updatePromotion);
promotionsRouter.delete('/:id', deletePromotion);
