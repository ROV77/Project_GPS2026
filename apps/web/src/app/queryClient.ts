import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único de TanStack Query para toda la app.
 *
 * - staleTime 30s: evita refetches inmediatos al navegar entre pantallas.
 * - retry 1: la API es local/propia; reintentar muchas veces solo esconde errores.
 * - refetchOnWindowFocus false: en un panel B2B el refetch al volver a la pestaña
 *   suele molestar más que ayudar; preferimos invalidar explícito tras mutaciones.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
