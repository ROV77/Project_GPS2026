import { Router } from 'express';
import { checkoutSchema, confirmSchema } from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { withStore } from '../middlewares/withStore';
import {
  getMySubscription,
  checkout,
  confirmCheckout,
  cancelSubscription,
  webhook,
} from '../controllers/subscriptions.controller';

export const subscriptionsRouter = Router();

// Público: lo llama MercadoPago directamente, no la sesión del usuario.
// Debe quedar ANTES del requireAuth/withStore de abajo para no exigir sesión.
subscriptionsRouter.post('/webhook', webhook);

subscriptionsRouter.use(requireAuth, withStore);
subscriptionsRouter.get('/me', getMySubscription);
subscriptionsRouter.post('/checkout', validateBody(checkoutSchema), checkout);
subscriptionsRouter.post('/confirm', validateBody(confirmSchema), confirmCheckout);
subscriptionsRouter.post('/cancel', cancelSubscription);
