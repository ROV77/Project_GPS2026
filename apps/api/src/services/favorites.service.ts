import { prisma } from '../config/prisma';
import { HttpError } from '../lib/httpError';
import { findStoresByIdsWithRating } from '../repositories/store.repository';
import * as favoritesRepo from '../repositories/favorites.repository';

/** Verifica que la tienda exista; lanza 404 si no. */
async function assertStoreExists(storeId: bigint): Promise<void> {
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
    select: { id: true },
  });
  if (!store) throw new HttpError(404, 'Tienda no encontrada');
}

export const favoritesService = {
  /** Tiendas favoritas del usuario, enriquecidas y ordenadas por más reciente. */
  async list(userId: bigint) {
    const storeIds = await favoritesRepo.listStoreIdsByUser(userId);
    return findStoresByIdsWithRating(storeIds);
  },

  /** Marca una tienda como favorita (idempotente). */
  async add(userId: bigint, storeId: bigint) {
    await assertStoreExists(storeId);
    await favoritesRepo.add(userId, storeId);
  },

  /** Quita una tienda de favoritos (idempotente). */
  async remove(userId: bigint, storeId: bigint) {
    await favoritesRepo.remove(userId, storeId);
  },
};
