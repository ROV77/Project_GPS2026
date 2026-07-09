import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';

/**
 * Exige un JWT válido en `Authorization: Bearer <token>`. Si es válido, deja el
 * id del usuario en `res.locals.userId` (siguiendo el patrón de res.locals del
 * resto de la API). Si no, responde 401.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Token no proporcionado'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const sub = typeof payload === 'string' ? payload : payload.sub;
    if (!sub) {
      next(new HttpError(401, 'Token inválido'));
      return;
    }
    _res.locals.userId = BigInt(sub);
    next();
  } catch {
    next(new HttpError(401, 'Token inválido o expirado'));
  }
}
