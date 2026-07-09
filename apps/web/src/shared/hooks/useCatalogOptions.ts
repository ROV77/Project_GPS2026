import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { Paginated, Id } from '@/shared/api/types';
import type { SelectOption } from '@/shared/ui/Select';

interface NamedRecord {
  id: Id;
  name?: string | null;
  email?: string | null;
}

/**
 * Carga genérica de opciones para <Select> de claves foráneas (categorías,
 * regiones, comunas, tiendas, usuarios...). Pide hasta 100 registros del recurso
 * y los mapea a { value, label }. El value SIEMPRE es el id como string (los IDs
 * son BIGINT; nunca se convierten a number aquí para no perder precisión).
 * Cachea 5 min porque son catálogos que cambian poco.
 */
export function useCatalogOptions(resource: string) {
  const query = useQuery({
    queryKey: [resource, 'options'],
    queryFn: () =>
      api
        .get<Paginated<NamedRecord>>(`/${resource}`, { params: { limit: 100 } })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const options: SelectOption[] = (query.data?.data ?? []).map((r) => ({
    value: r.id,
    label: r.name || r.email || `#${r.id}`,
  }));

  return { options, isLoading: query.isLoading };
}
