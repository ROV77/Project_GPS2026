import type { StoreProfileInput, UpdateStoreInput } from '@caserita/validations';

/**
 * Adapta los valores del formulario de perfil al payload de actualización.
 * Hoy el shape coincide; se mantiene como punto único por si luego hay
 * campos solo de UI que omitir.
 */
export function toStoreUpdatePayload(values: StoreProfileInput): UpdateStoreInput {
  return values;
}
