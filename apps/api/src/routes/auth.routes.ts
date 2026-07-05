import { Router } from 'express';
import {
  loginSchema,
  registerSchema,
  registerCourierSchema,
  updateProfileSchema,
} from '@caserita/validations';
import { validateBody } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import {
  login,
  register,
  registerCourier,
  registerCustomer,
  becomeCourier,
  quitCourier,
  updateMe,
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

// POST /api/auth/register-customer → { token, user } (cuenta + rol customer)
// Mismo body que courier (name/email/password): reutiliza su schema.
authRouter.post(
  '/register-customer',
  validateBody(registerCourierSchema),
  registerCustomer,
);

// POST /api/auth/become-courier → { user, store } (suma rol delivery al usuario logueado)
authRouter.post('/become-courier', requireAuth, becomeCourier);

// POST /api/auth/quit-courier → { user, store } (quita rol delivery al usuario logueado)
authRouter.post('/quit-courier', requireAuth, quitCourier);

// GET /api/auth/me → { user, store } (requiere Bearer token)
authRouter.get('/me', requireAuth, me);

// PATCH /api/auth/me → { user, store } (actualiza el perfil propio: name/phone/avatar_url)
authRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), updateMe);
