import { Request, Response } from 'express';
import type {
  LoginInput,
  RegisterInput,
  RegisterCourierInput,
  UpdateProfileInput,
} from '@caserita/validations';
import {
  loginService,
  registerService,
  registerCourierService,
  registerCustomerService,
  becomeCourierService,
  quitCourierService,
  updateMeService,
  getMeService,
} from '../services/auth.service';

/** POST /auth/login — el body ya viene validado por validateBody(loginSchema). */
export const login = async (_req: Request, res: Response): Promise<void> => {
  const { email, password } = res.locals.body as LoginInput;
  const result = await loginService(email, password);
  res.json(result);
};

/** POST /auth/register — body validado por validateBody(registerSchema). */
export const register = async (_req: Request, res: Response): Promise<void> => {
  const result = await registerService(res.locals.body as RegisterInput);
  res.status(201).json(result);
};

/** POST /auth/register-courier — body validado por registerCourierSchema. */
export const registerCourier = async (_req: Request, res: Response): Promise<void> => {
  const result = await registerCourierService(
    res.locals.body as RegisterCourierInput,
  );
  res.status(201).json(result);
};

/** POST /auth/register-customer — body validado por registerCourierSchema (name/email/password). */
export const registerCustomer = async (_req: Request, res: Response): Promise<void> => {
  const result = await registerCustomerService(
    res.locals.body as RegisterCourierInput,
  );
  res.status(201).json(result);
};

/** POST /auth/become-courier — requireAuth dejó el id en res.locals.userId. */
export const becomeCourier = async (_req: Request, res: Response): Promise<void> => {
  const result = await becomeCourierService(res.locals.userId as bigint);
  res.json(result);
};

/** POST /auth/quit-courier — requireAuth dejó el id en res.locals.userId. */
export const quitCourier = async (_req: Request, res: Response): Promise<void> => {
  const result = await quitCourierService(res.locals.userId as bigint);
  res.json(result);
};

/** PATCH /auth/me — actualiza el perfil propio (body validado por updateProfileSchema). */
export const updateMe = async (_req: Request, res: Response): Promise<void> => {
  const result = await updateMeService(
    res.locals.userId as bigint,
    res.locals.body as UpdateProfileInput,
  );
  res.json(result);
};

/** GET /auth/me — requireAuth ya dejó el id del usuario en res.locals.userId. */
export const me = async (_req: Request, res: Response): Promise<void> => {
  const result = await getMeService(res.locals.userId as bigint);
  res.json(result);
};
