import { prisma } from '../config/prisma';

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
 * Crea la cuenta y su tienda en una sola transacción (una cuenta = una tienda).
 * El password ya viene hasheado. Devuelve el usuario creado.
 */
export async function createUserWithStore(input: {
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
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
      data: { owner_id: user.id, name: input.storeName },
    });
    return user;
  });
}
