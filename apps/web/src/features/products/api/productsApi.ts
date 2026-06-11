import { api } from '@/shared/api/client';
import type { Paginated, Id, PageParams } from '@/shared/api/types';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '@caserita/validations';
import type { Product } from '../types';

/**
 * Funciones puras de acceso a /api/products. No saben de React: solo hacen la
 * llamada y devuelven datos. Los hooks de TanStack Query (useProducts) las usan.
 */
export const productsApi = {
  list: ({ page, limit }: PageParams) =>
    api
      .get<Paginated<Product>>('/products', { params: { page, limit } })
      .then((r) => r.data),

  create: (data: CreateProductInput) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: ({ id, data }: { id: Id; data: UpdateProductInput }) =>
    api.put<Product>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: Id) => api.delete(`/products/${id}`).then(() => id),
};
