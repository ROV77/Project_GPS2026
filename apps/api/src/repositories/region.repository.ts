import { prisma } from '../config/prisma';

/**
 * Comunas que pertenecen a una región, ordenadas alfabéticamente.
 * Usado para el dropdown en cascada del frontend:
 * el usuario selecciona región y se cargan las comunas disponibles.
 *
 * Usa el índice `idx_communes_region_name` (region_id, name).
 */
export async function findCommunesByRegion(regionId: number) {
  return prisma.communes.findMany({
    where: { region_id: BigInt(regionId) },
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  });
}

/**
 * Todas las regiones de Chile, ordenadas alfabéticamente.
 * Ideal para cachear en el cliente, solo 16 registros.
 */
export async function findAllRegions() {
  return prisma.regions.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
