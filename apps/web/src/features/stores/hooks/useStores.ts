import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesApi } from '../api/storesApi';

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
