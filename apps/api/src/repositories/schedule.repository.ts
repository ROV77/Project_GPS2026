import { prisma } from '../config/prisma';
import type { DayScheduleInput } from '@caserita/validations';

/**
 * Convierte una hora "HH:mm" o "HH:mm:ss" a Date.
 * Prisma representa las columnas TIME como DateTime, así que espera un Date
 * (no el string crudo). Anclamos al epoch 1970-01-01 UTC; solo importa la hora.
 */
function timeToDate(time: string | null | undefined): Date | null {
  if (!time) return null;
  return new Date(`1970-01-01T${time.length === 5 ? `${time}:00` : time}Z`);
}

/**
 * Obtiene los 7 horarios de una tienda, ordenados por día de la semana.
 * Devuelve un array vacío si la tienda no tiene horarios configurados.
 */
export async function findSchedulesByStore(storeId: bigint) {
  return prisma.store_schedules.findMany({
    where: { store_id: storeId },
    orderBy: { day_of_week: 'asc' },
  });
}

/**
 * Obtiene el horario de un día específico para una tienda.
 * Devuelve null si no existe (= tienda sin horarios configurados).
 */
export async function findScheduleForDay(storeId: bigint, dayOfWeek: number) {
  return prisma.store_schedules.findUnique({
    where: {
      store_id_day_of_week: { store_id: storeId, day_of_week: dayOfWeek },
    },
  });
}

/**
 * Upsert de los 7 días de horario de una tienda en una transacción.
 * Usa upsert para crear si no existe o actualizar si ya existe, basándose
 * en la constraint UNIQUE(store_id, day_of_week).
 */
export async function upsertSchedules(storeId: bigint, schedules: DayScheduleInput[]) {
  const operations = schedules.map((s) =>
    prisma.store_schedules.upsert({
      where: {
        store_id_day_of_week: { store_id: storeId, day_of_week: s.day_of_week },
      },
      create: {
        store_id: storeId,
        day_of_week: s.day_of_week,
        is_closed: s.is_closed,
        opening_time: s.is_closed ? null : timeToDate(s.opening_time),
        closing_time: s.is_closed ? null : timeToDate(s.closing_time),
      },
      update: {
        is_closed: s.is_closed,
        opening_time: s.is_closed ? null : timeToDate(s.opening_time),
        closing_time: s.is_closed ? null : timeToDate(s.closing_time),
      },
    }),
  );

  return prisma.$transaction(operations);
}

/**
 * Obtiene los horarios del día actual para un conjunto de tiendas (batch).
 * Usado por el listado filtrado para enriquecer con el semáforo sin N+1.
 */
export async function findTodaySchedulesForStores(storeIds: bigint[], dayOfWeek: number) {
  return prisma.store_schedules.findMany({
    where: {
      store_id: { in: storeIds },
      day_of_week: dayOfWeek,
    },
  });
}
