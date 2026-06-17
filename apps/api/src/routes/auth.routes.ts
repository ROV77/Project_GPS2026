import { Router } from 'express';
import { loginSchema, registerSchema } from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { login, register, me } from '../controllers/auth.controller';

export const authRouter = Router();

// POST /api/auth/login → { token, user }
authRouter.post('/login', validateBody(loginSchema), login);

// POST /api/auth/register → { token, user } (crea cuenta + tienda)
authRouter.post('/register', validateBody(registerSchema), register);

// GET /api/auth/me → { user, store } (requiere Bearer token)
authRouter.get('/me', requireAuth, me);
