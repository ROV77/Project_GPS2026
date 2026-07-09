import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/app/queryClient';

/**
 * Providers globales: el cliente de TanStack Query y el `<Toaster>` de sonner
 * (montado una vez) que alimenta `toast.success/error`.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
