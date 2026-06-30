import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

/** Asigna un rol por nombre (lo crea si no existe) dentro de una transacción. */
async function assignRole(
  tx: Prisma.TransactionClient,
  userId: bigint,
  roleName: string,
) {
  const role = await tx.roles.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName },
  });
  await tx.user_roles.create({
    data: { user_id: userId, role_id: role.id },
  });
}

/** Nombres de los roles de un usuario (para exponerlos en login/me). */
export async function getRoleNames(userId: bigint): Promise<string[]> {
  const rows = await prisma.user_roles.findMany({
    where: { user_id: userId },
    include: { roles: true },
  });
  return rows.map((r) => r.roles.name);
}

/**
 * Busca un usuario activo por email (incluye el hash para verificar la
 * contraseña). Devuelve null si no existe o está dado de baja.
 */
export async function findUserByEmail(email: string) {
  return prisma.users.findFirst({
    where: { email, deleted_at: null },
  });
}

/**
 * Actualiza el perfil propio del usuario (name/phone/avatar_url). Solo los
 * campos presentes; usado por PATCH /auth/me (scopeado al usuario logueado).
 */
export async function updateUserProfile(
  userId: bigint,
  data: { name?: string; phone?: string; avatar_url?: string },
) {
  return prisma.users.update({ where: { id: userId }, data });
}

/**
 * Usuario por id junto a su tienda (modelo de negocio: una cuenta = una tienda).
 * Se usa en GET /auth/me para hidratar la sesión del panel.
 */
export async function findUserWithStoreById(id: bigint) {
  return prisma.users.findFirst({
    where: { id, deleted_at: null },
    include: { stores: { take: 1, orderBy: { id: 'asc' } } },
  });
}

/**
 * Crea la cuenta + su tienda + el rol `seller` en una sola transacción
 * (una cuenta = una tienda). El password ya viene hasheado. Los ids de
 * catálogo llegan como number y se persisten como BigInt.
 */
export async function createUserWithStore(input: {
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
  categoryId: number;
  regionId: number;
  communeId: number;
  description?: string;
  storePhone?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: input.passwordHash,
      },
    });
    await tx.stores.create({
      data: {
        owner_id: user.id,
        name: input.storeName,
        category_id: BigInt(input.categoryId),
        region_id: BigInt(input.regionId),
        commune_id: BigInt(input.communeId),
        description: input.description || null,
        store_phone: input.storePhone || null,
      },
    });
    await assignRole(tx, user.id, 'seller');
    return user;
  });
}

/**
 * Crea una cuenta simple (sin tienda) con un rol dado, en una transacción.
 * Base de los registros de repartidor (`delivery`) y cliente (`customer`).
 */
async function createUserWithRole(
  input: { name: string; email: string; passwordHash: string },
  roleName: string,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: input.passwordHash,
      },
    });
    await assignRole(tx, user.id, roleName);
    return user;
  });
}

/** Crea un repartidor (rol `delivery`). El password ya viene hasheado. */
export function createCourierUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return createUserWithRole(input, 'delivery');
}

/** Crea un cliente/usuario normal (rol `customer`). El password ya viene hasheado. */
export function createCustomerUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return createUserWithRole(input, 'customer');
}

/**
 * Agrega un rol al usuario si aún no lo tiene (idempotente). Permite que un
 * mismo correo acumule roles (p.ej. un cliente que además se vuelve repartidor).
 */
export async function addRoleIfMissing(userId: bigint, roleName: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const role = await tx.roles.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    const existing = await tx.user_roles.findFirst({
      where: { user_id: userId, role_id: role.id },
    });
    if (!existing) {
      await tx.user_roles.create({
        data: { user_id: userId, role_id: role.id },
      });
    }
  });
}
