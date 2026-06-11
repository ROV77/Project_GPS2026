import { Router } from 'express';
import { authRouter } from './auth.routes';
import { regionsRouter } from './regions.routes';
import { communesRouter } from './communes.routes';
import { categoriesRouter } from './categories.routes';
import { plansRouter } from './plans.routes';
import { usersRouter } from './users.routes';
import { storesRouter } from './stores.routes';
import { productsRouter } from './products.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/regions', regionsRouter);
apiRouter.use('/communes', communesRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/plans', plansRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/stores', storesRouter);
apiRouter.use('/products', productsRouter);
