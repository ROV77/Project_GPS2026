import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';

const KEY = 'my-account';

export function useMyAccount() {
  return useQuery({ queryKey: [KEY], queryFn: userApi.getMine });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
