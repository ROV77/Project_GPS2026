import { Router } from 'express';
import { authRouter } from './auth.routes';
import { regionsRouter } from './regions.routes';
import { communesRouter } from './communes.routes';
import { categoriesRouter } from './categories.routes';
import { plansRouter } from './plans.routes';
import { usersRouter } from './users.routes';
import { storesRouter } from './stores.routes';
import { productsRouter } from './products.routes';
import { couriersRouter } from './couriers.routes';
import { uploadsRouter } from './uploads.routes';
import { subscriptionsRouter } from './subscriptions.routes';

import { deliveryVacanciesRouter } from './delivery/deliveryVacancies.routes';
import { deliveryApplicationsRouter } from './delivery/deliveryApplications.routes';
import { courierRatingsRouter } from './delivery/courierRatings.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/regions', regionsRouter);
apiRouter.use('/communes', communesRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/plans', plansRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/stores', storesRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/couriers', couriersRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/subscriptions', subscriptionsRouter);

apiRouter.use('/delivery-vacancies', deliveryVacanciesRouter);
apiRouter.use('/delivery-applications', deliveryApplicationsRouter);
apiRouter.use('/courier-ratings', courierRatingsRouter);
