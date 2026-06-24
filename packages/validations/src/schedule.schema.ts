import { z } from 'zod';

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Debe tener formato HH:mm o HH:mm:ss')
  .nullable();

const dayScheduleSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    is_closed: z.boolean(),
    opening_time: timeField.optional(),
    closing_time: timeField.optional(),
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
