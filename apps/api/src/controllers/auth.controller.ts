import { Request, Response } from 'express';
import type {
  LoginInput,
  RegisterInput,
  RegisterCourierInput,
} from '@caserita/validations';
import {
  loginService,
  registerService,
  registerCourierService,
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

/** GET /auth/me — requireAuth ya dejó el id del usuario en res.locals.userId. */
export const me = async (_req: Request, res: Response): Promise<void> => {
  const result = await getMeService(res.locals.userId as bigint);
  res.json(result);
};
