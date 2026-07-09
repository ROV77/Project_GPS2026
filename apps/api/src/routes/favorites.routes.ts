import { Router } from 'express';
import { addFavoriteSchema } from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favorites.controller';

export const favoritesRouter = Router();

// Todo el router es de usuario autenticado: opera sobre res.locals.userId.
favoritesRouter.use(requireAuth);

favoritesRouter.get('/', listFavorites);
favoritesRouter.post('/', validateBody(addFavoriteSchema), addFavorite);
favoritesRouter.delete('/:storeId', removeFavorite);
