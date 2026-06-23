import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';
import type { SelectOption } from '@/shared/ui/Select';

interface Commune {
  id: Id;
  name: string;
  city?: string | null;
}

/**
 * Comunas de una región para selects en cascada. Usa el endpoint dedicado
 * GET /regions/:regionId/communes (devuelve solo las de esa región, indexado).
 * Solo consulta cuando hay regionId. El value es el id como string (BIGINT).
 */
export function useCommunesByRegion(regionId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['regions', regionId, 'communes'],
    queryFn: () =>
      api.get<Commune[]>(`/regions/${regionId}/communes`).then((r) => r.data),
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
  });

  const options: SelectOption[] = (query.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return { options, isLoading: query.isLoading };
}
