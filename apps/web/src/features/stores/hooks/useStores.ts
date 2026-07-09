import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesApi } from '../api/storesApi';
import type { Id } from '@/shared/api/types';

const KEY = 'my-store';

/** Carga la única tienda de la cuenta (ver storesApi.getMine). */
export function useMyStore() {
  return useQuery({ queryKey: [KEY], queryFn: storesApi.getMine });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useStoreSchedules(storeId: Id | undefined) {
  return useQuery({
    queryKey: ['store-schedules', storeId],
    queryFn: () => storesApi.getSchedules(storeId!),
    enabled: !!storeId,
  });
}

export function useUpdateStoreSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: storesApi.updateSchedules,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['store-schedules', variables.storeId] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

