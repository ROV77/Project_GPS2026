import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import type { ProductListParams } from '../types';

const KEY = 'products';

/**
 * Lista paginada con filtros opcionales (search/featured/lowStock/sort).
 * `keepPreviousData` mantiene la página anterior visible mientras llega la
 * nueva, evitando parpadeos al cambiar de página o filtros.
 */
export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Mutaciones de escritura. Tras cada una, invalidan la query [KEY] para que la
 * lista se refresque desde el servidor (clave con el soft delete: la fila
 * "eliminada" desaparece porque el backend deja de devolverla).
 */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
