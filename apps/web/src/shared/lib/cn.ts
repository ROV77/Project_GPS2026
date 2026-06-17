/**
 * Shim de transición. El `cn` canónico vive en `@/lib/utils` (convención
 * shadcn). Este re-export evita tocar los imports existentes de golpe; se
 * eliminará cuando termine la migración del kit a `components/ui`.
 */
export { cn } from '@/lib/utils';
