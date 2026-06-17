import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';
import {
  findUserByEmail,
  findUserWithStoreById,
} from '../repositories/auth.repository';

/** Firma un JWT cuyo `sub` es el id del usuario (como string, por el BigInt). */
function signToken(userId: bigint): string {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Valida credenciales y devuelve el token + datos públicos del usuario.
 * Lanza 401 genérico si el email no existe o la contraseña no coincide
 * (no se distingue cuál para no filtrar qué emails están registrados).
 */
export async function loginService(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

/** Devuelve el usuario logueado y su tienda (para hidratar el panel). */
export async function getMeService(userId: bigint) {
  const user = await findUserWithStoreById(userId);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const { password_hash: _omit, stores, ...publicUser } = user;
  return {
    user: publicUser,
    store: stores[0] ?? null,
  };
}
