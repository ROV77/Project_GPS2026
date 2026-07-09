import type { SelectOption } from '@/shared/ui/Select';

/** Clave canónica para comparar regiones chilenas con distintos formatos de Nominatim. */
function regionKey(value: string): string | null {
  const s = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

  if (s.includes('metropolitana') || /\bsantiago\b/.test(s)) return 'metropolitana';
  if (s.includes('biobio') || s.includes('bío bío')) return 'biobio';
  if (s.includes('valparaiso') || s.includes('valparaíso')) return 'valparaiso';
  if (s.includes('araucania') || s.includes('araucanía')) return 'araucania';
  if (s.includes('los lagos')) return 'los lagos';
  if (s.includes('los rios') || s.includes('ríos')) return 'los rios';
  if (s.includes('magallanes')) return 'magallanes';
  if (s.includes('antofagasta')) return 'antofagasta';
  if (s.includes('atacama')) return 'atacama';
  if (s.includes('coquimbo')) return 'coquimbo';
  if (s.includes("o'higgins") || s.includes('ohiggins')) return 'ohiggins';
  if (s.includes('maule')) return 'maule';
  if (s.includes('nuble') || s.includes('ñuble')) return 'nuble';
  if (s.includes('tarapaca') || s.includes('tarapacá')) return 'tarapaca';
  if (s.includes('arica')) return 'arica';

  return null;
}

/** Normaliza nombres administrativos para comparación flexible. */
export function normalizeAdminName(value: string): string {
  const canonicalRegion = regionKey(value);
  if (canonicalRegion) return canonicalRegion;

  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\bregion\b/g, '')
    .replace(/\bdel\b/g, '')
    .replace(/\bde\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(candidate: string, target: string): boolean {
  const candidateRegion = regionKey(candidate);
  const targetRegion = regionKey(target);
  if (candidateRegion && targetRegion) {
    return candidateRegion === targetRegion;
  }

  const a = normalizeAdminName(candidate);
  const b = normalizeAdminName(target);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** Resuelve el id de región del catálogo a partir del nombre geocodificado. */
export function resolveRegionId(
  regionName: string | undefined,
  regions: SelectOption[],
): number | undefined {
  if (!regionName?.trim()) return undefined;

  const match = regions.find((region) => namesMatch(regionName, region.label));
  return match ? Number(match.value) : undefined;
}

/** Resuelve el id de comuna del catálogo a partir del nombre geocodificado. */
export function resolveCommuneId(
  communeName: string | undefined,
  communes: SelectOption[],
): number | undefined {
  if (!communeName?.trim()) return undefined;

  const match = communes.find((commune) => namesMatch(communeName, commune.label));
  return match ? Number(match.value) : undefined;
}

export interface ResolvedCatalogLocation {
  regionId?: number;
  communeId?: number;
}

/** Resuelve región y comuna del catálogo a partir de nombres geocodificados. */
export function resolveCatalogLocation(
  regionName: string | undefined,
  communeName: string | undefined,
  regions: SelectOption[],
  communes: SelectOption[],
): ResolvedCatalogLocation {
  const regionId = resolveRegionId(regionName, regions);
  const communeId = resolveCommuneId(communeName, communes);
  return { regionId, communeId };
}
