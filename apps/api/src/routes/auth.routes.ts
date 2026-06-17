import { Router } from 'express';
import { loginSchema } from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { login, me } from '../controllers/auth.controller';

export const authRouter = Router();

// POST /api/auth/login → { token, user }
authRouter.post('/login', validateBody(loginSchema), login);

// GET /api/auth/me → { user, store } (requiere Bearer token)
authRouter.get('/me', requireAuth, me);
