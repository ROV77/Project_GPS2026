/**
 * Traduce un error de axios a un mensaje legible en español. Prioriza el
 * `{ error }` que devuelve la API; si no, distingue fallos de red/timeout
 * (frecuentes en mobile cuando EXPO_PUBLIC_API_URL apunta mal).
 */
import axios from 'axios';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.code === 'ECONNABORTED') {
      return 'Tiempo de espera agotado. Revisa tu conexión.';
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor.';
    }
  }
  return fallback;
}
