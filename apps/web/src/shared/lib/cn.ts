import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases de Tailwind resolviendo conflictos (la última gana). Permite
 * componer clases condicionales y dejar que el consumidor sobreescriba con
 * `className`. Ej: cn('px-3 py-2', isActive && 'bg-brand-700', className).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
