import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from '../lib/httpError';
import type { RegisterInput, RegisterCourierInput } from '@caserita/validations';
import {
  createUserWithStore,
  createCourierUser,
  findUserByEmail,
  findUserWithStoreById,
  getRoleNames,
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
      roles: await getRoleNames(user.id),
    },
  };
}

/**
 * Registra un dueño de negocio: crea su cuenta + tienda y devuelve el mismo
 * shape que el login ({ token, user }) para iniciar sesión de inmediato.
 * Lanza 409 si el email ya está registrado.
 */
export async function registerService(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new HttpError(409, 'El correo ya está registrado');
  }

  const user = await createUserWithStore({
    name: input.name,
    email: input.email,
    passwordHash: bcrypt.hashSync(input.password, 10),
    storeName: input.storeName,
    categoryId: input.category_id,
    regionId: input.region_id,
    communeId: input.commune_id,
    description: input.description,
    storePhone: input.store_phone,
  });

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: ['seller'],
    },
  };
}

/**
 * Registra un repartidor: crea su cuenta con rol `delivery` y devuelve el mismo
 * shape que el login ({ token, user }). Lanza 409 si el email ya existe.
 */
export async function registerCourierService(input: RegisterCourierInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new HttpError(409, 'El correo ya está registrado');
  }

  const user = await createCourierUser({
    name: input.name,
    email: input.email,
    passwordHash: bcrypt.hashSync(input.password, 10),
  });

  return {
    token: signToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: ['delivery'],
    },
  };
}

/** Devuelve el usuario logueado, su tienda y sus roles (para hidratar el panel). */
export async function getMeService(userId: bigint) {
  const user = await findUserWithStoreById(userId);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const { password_hash: _omit, stores, ...publicUser } = user;
  return {
    user: { ...publicUser, roles: await getRoleNames(user.id) },
    store: stores[0] ?? null,
  };
}
