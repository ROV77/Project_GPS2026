import { prisma } from '../config/prisma';

/**
 * Repositorio de favoritos (relación usuario ↔ tienda). Solo acceso a datos;
 * las reglas de negocio (validar que la tienda existe) viven en el service.
 */

/** IDs de las tiendas favoritas del usuario, más recientes primero. */
export async function listStoreIdsByUser(userId: bigint): Promise<bigint[]> {
  const rows = await prisma.favorites.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { store_id: true },
  });
  return rows.map((r) => r.store_id);
}

/** IDs de los usuarios que marcaron una tienda como favorita (para el fan-out de avisos). */
export async function listUserIdsByStore(storeId: bigint): Promise<bigint[]> {
  const rows = await prisma.favorites.findMany({
    where: { store_id: storeId },
    select: { user_id: true },
  });
  return rows.map((r) => r.user_id);
}

/**
 * Alta idempotente: si ya existe el par (user, store) no hace nada gracias a la
 * constraint UNIQUE(user_id, store_id). Devuelve true si quedó marcada.
 */
export async function add(userId: bigint, storeId: bigint): Promise<void> {
  await prisma.favorites.upsert({
    where: { user_id_store_id: { user_id: userId, store_id: storeId } },
    create: { user_id: userId, store_id: storeId },
    update: {},
  });
}

/** Baja idempotente: borra el par si existe (deleteMany no falla si no hay fila). */
export async function remove(userId: bigint, storeId: bigint): Promise<void> {
  await prisma.favorites.deleteMany({
    where: { user_id: userId, store_id: storeId },
  });
}
