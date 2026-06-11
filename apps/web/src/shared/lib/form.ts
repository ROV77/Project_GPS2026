import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { getValidationIssues } from '@/shared/api/errors';

/**
 * Mapea los errores de validación 400 de la API ({ campo: ["mensaje"] }) a los
 * campos de un formulario react-hook-form vía setError. Centraliza el patrón que
 * antes se repetía en cada formulario (productos, tienda, cuenta).
 *
 * Devuelve `true` si el error ERA un 400 con issues (ya pintados por campo): en
 * ese caso el caller no debe mostrar un message global. Devuelve `false` si el
 * error es de otro tipo, para que el caller lo muestre con getApiErrorMessage.
 */
export function applyApiValidationErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  const issues = getValidationIssues(error);
  if (!issues) return false;
  for (const [field, msgs] of Object.entries(issues)) {
    setError(field as Path<T>, { message: msgs[0] });
  }
  return true;
}
