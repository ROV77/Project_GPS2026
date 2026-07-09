import type { StoreVisualStatus, StoreStatusResult } from '../types/store.types';

// ─── Constantes configurables ────────────────────────────────────────────────

/** Umbral en minutos para estado "closing_soon" (amarillo) */
const CLOSING_SOON_THRESHOLD_MINUTES = 30;

/** Zona horaria de referencia para tiendas chilenas */
const STORE_TIMEZONE = 'America/Santiago';

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * Calcula el estado visual (semáforo) de una tienda basándose en la hora
 * actual del servidor y los horarios de apertura/cierre configurados.
 *
 * Reglas:
 *   🟢 Verde    → Abierta, faltan más de 30 min para cerrar
 *   🟡 Amarillo → Abierta, faltan ≤ 30 min para cerrar
 *   🔴 Rojo     → Cerrada, marcada como cerrada, o sin horario configurado
 *
 * Soporta horarios nocturnos que cruzan la medianoche (ej. 22:00 → 03:00).
 *
 * @param openingTime - Hora de apertura en formato "HH:mm:ss" o null
 * @param closingTime - Hora de cierre en formato "HH:mm:ss" o null
 * @param options.isClosed - Si true, el día está marcado como cerrado (desde store_schedules)
 * @param options.now - Momento actual (inyectable para testing)
 * @returns StoreStatusResult con status, label, color y minutesUntilClose
 */
export function calculateStoreStatus(
  openingTime: string | null,
  closingTime: string | null,
  options?: {
    isClosed?: boolean;
    now?: Date;
  },
): StoreStatusResult {
  // Día explícitamente marcado como cerrado → cerrado
  if (options?.isClosed) {
    return closed();
  }

  // Sin horario configurado → cerrado
  if (!openingTime || !closingTime) {
    return closed();
  }

  // Obtener hora actual en zona horaria de Chile
  const currentTimeStr = getCurrentTimeInTimezone(options?.now);

  const currentMinutes = timeToMinutes(currentTimeStr);
  const openMinutes = timeToMinutes(openingTime);
  const closeMinutes = timeToMinutes(closingTime);

  // Determinar si está dentro del horario (soporta cruce de medianoche)
  const isOpen = isWithinSchedule(currentMinutes, openMinutes, closeMinutes);

  if (!isOpen) {
    return closed();
  }

  // Calcular minutos restantes hasta el cierre
  let minutesUntilClose = closeMinutes - currentMinutes;
  if (minutesUntilClose < 0) {
    minutesUntilClose += 24 * 60; // cruce de medianoche
  }

  if (minutesUntilClose <= CLOSING_SOON_THRESHOLD_MINUTES) {
    return {
      status: 'closing_soon',
      label: 'Cierra pronto',
      color: 'yellow',
      minutesUntilClose,
    };
  }

  return {
    status: 'open',
    label: 'Abierto',
    color: 'green',
    minutesUntilClose,
  };
}

/**
 * Obtiene el día de la semana actual en la zona horaria de Chile.
 */
export function getCurrentDayOfWeek(now?: Date): number {
  const date = now ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: STORE_TIMEZONE,
    weekday: 'short',
  });
  const dayStr = formatter.format(date); // "Sun", "Mon", ...
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return dayMap[dayStr] ?? 0;
}

/** Resultado para tienda cerrada (reutilizado en múltiples ramas) */
function closed(): StoreStatusResult {
  return { status: 'closed', label: 'Cerrado', color: 'red', minutesUntilClose: null };
}

/**
 * Obtiene la hora actual formateada como "HH:mm:ss" en la zona horaria de Chile.
 * Usa Intl.DateTimeFormat para convertir desde UTC sin librerías externas.
 */
function getCurrentTimeInTimezone(now?: Date): string {
  const date = now ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: STORE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date); // "HH:mm:ss"
}

/**
 * Convierte una hora en formato "HH:mm:ss" o "HH:mm" a total de minutos
 * desde la medianoche. Ignora los segundos para la lógica de estado.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Determina si la hora actual está dentro del rango [open, close).
 */
function isWithinSchedule(current: number, open: number, close: number): boolean {
  if (close > open) {
    return current >= open && current < close;
  }
  return current >= open || current < close;
}
