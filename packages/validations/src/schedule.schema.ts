import { z } from 'zod';
import { timeField } from './store.schema';

const dayScheduleSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_closed: z.boolean(),
    opening_time: timeField,
    closing_time: timeField,
  })
  .refine(
    (data) => {
      // Si no está cerrado, apertura y cierre son obligatorios
      if (!data.is_closed) {
        return data.opening_time != null && data.closing_time != null;
      }
      return true;
    },
    { message: 'Debe tener horario de apertura y cierre si el día no está marcado como cerrado' },
  );

export const upsertSchedulesSchema = z
  .array(dayScheduleSchema)
  .length(7, 'Debe incluir exactamente 7 días')
  .refine(
    (arr) => {
      const days = arr.map((d) => d.day_of_week).sort((a, b) => a - b);
      return days.length === 7 && days.every((d, i) => d === i);
    },
    { message: 'Debe incluir cada día de la semana exactamente una vez (0=domingo a 6=sábado)' },
  );

// ─── Tipos inferidos ─────────────────────────────────────────────────────────

export type DayScheduleInput = z.infer<typeof dayScheduleSchema>;
export type UpsertSchedulesInput = z.infer<typeof upsertSchedulesSchema>;
