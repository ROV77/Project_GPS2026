import { findAllRegions, findCommunesByRegion } from '../repositories/region.repository';

export const getAllRegionsService = async () => {
  // Aquí irá la futura lógica de negocio si es necesaria
  return await findAllRegions();
};

export const getCommunesByRegionService = async (regionId: number) => {
  // Aquí irá la futura lógica de negocio si es necesaria
  return await findCommunesByRegion(regionId);
};
