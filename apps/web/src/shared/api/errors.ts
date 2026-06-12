import { isAxiosError } from 'axios';
import type { ApiErrorBody } from './types';

/**
 * Helpers para leer los errores de la API de forma uniforme. Mantenemos esto
 * agnóstico de React/react-hook-form: el binding a formularios se hace en el
 * propio componente con setError (ver features/products/components/ProductFormDrawer).
 */

/** Mensaje legible para mostrar en un message/notification. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error ?? error.message ?? fallback;
  }
  return fallback;
}

/**
 * Devuelve los issues de validación (400 zod) como { campo: ["msg"] }, o null
 * si el error no es un 400 con issues. Útil para pintar errores por campo.
 */
export function getValidationIssues(
  error: unknown,
): Record<string, string[]> | null {
  if (
    isAxiosError<ApiErrorBody>(error) &&
    error.response?.status === 400 &&
    error.response.data?.issues
  ) {
    return error.response.data.issues;
  }
  return null;
}

/** True si el error es un 409 (valor duplicado o referencia FK inválida). */
export function isConflictError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409;
}
