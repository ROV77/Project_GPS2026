import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi } from '../api/promotionsApi';

const KEY = 'promotions';

/** Listado de promociones de la tienda (activas primero). */
export function usePromotions() {
  return useQuery({
    queryKey: [KEY],
    queryFn: promotionsApi.list,
  });
}

/**
 * Mutaciones de escritura. Tras cada una invalidan [KEY] para refrescar la lista
 * desde el servidor (mismo patrón que useProducts).
 */
export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promotionsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
