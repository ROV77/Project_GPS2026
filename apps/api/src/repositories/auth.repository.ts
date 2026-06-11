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
