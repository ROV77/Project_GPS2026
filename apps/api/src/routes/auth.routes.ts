import { Router } from 'express';
import {
  loginSchema,
  registerSchema,
  registerCourierSchema,
} from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import {
  login,
  register,
  registerCourier,
  me,
} from '../controllers/auth.controller';

export const authRouter = Router();

// POST /api/auth/login → { token, user }
authRouter.post('/login', validateBody(loginSchema), login);

// POST /api/auth/register → { token, user } (crea cuenta + tienda, rol seller)
authRouter.post('/register', validateBody(registerSchema), register);

// POST /api/auth/register-courier → { token, user } (cuenta + rol delivery)
authRouter.post(
  '/register-courier',
  validateBody(registerCourierSchema),
  registerCourier,
);

// GET /api/auth/me → { user, store } (requiere Bearer token)
authRouter.get('/me', requireAuth, me);
