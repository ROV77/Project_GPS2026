import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Id } from '@/shared/api/types';
import { Button, Switch, Skeleton } from '@/shared/ui';
import { useStoreSchedules, useUpdateStoreSchedules } from '../hooks/useStores';
import { DAY_NAMES, type DaySchedule } from '../types';

export function ScheduleEditor({ storeId }: { storeId: Id }) {
  const { data: queryData, isLoading } = useStoreSchedules(storeId);
  const mutation = useUpdateStoreSchedules();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);

  useEffect(() => {
    if (queryData) {
      const merged = Array.from({ length: 7 }, (_, day) => {
        const existing = queryData.find((s) => s.day_of_week === day);
        if (existing) {
          return {
            ...existing,
            opening_time: existing.opening_time ? existing.opening_time.substring(0, 5) : null,
            closing_time: existing.closing_time ? existing.closing_time.substring(0, 5) : null,
          };
        }
        return {
          id: `temp-${day}`,
          store_id: String(storeId),
          day_of_week: day,
          is_closed: false,
          opening_time: '09:00',
          closing_time: '18:00',
        };
      });
      setSchedules(merged);
    }
  }, [queryData, storeId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleToggleClosed = (day: number) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day_of_week === day) {
          const nextClosed = !s.is_closed;
          return {
            ...s,
            is_closed: nextClosed,
            opening_time: nextClosed ? null : s.opening_time || '09:00',
            closing_time: nextClosed ? null : s.closing_time || '18:00',
          };
        }
        return s;
      }),
    );
  };

  const handleTimeChange = (
    day: number,
    field: 'opening_time' | 'closing_time',
    val: string,
  ) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day_of_week === day) {
          return { ...s, [field]: val || null };
        }
        return s;
      }),
    );
  };

  const handleSave = () => {
    const invalidDay = schedules.find(
      (s) => !s.is_closed && (!s.opening_time || !s.closing_time),
    );
    if (invalidDay) {
      toast.error(
        `El día ${DAY_NAMES[invalidDay.day_of_week]} no tiene un horario válido de apertura o cierre.`,
      );
      return;
    }

    const payload = schedules.map((s) => ({
      day_of_week: s.day_of_week,
      is_closed: s.is_closed,
      opening_time: s.is_closed ? null : s.opening_time,
      closing_time: s.is_closed ? null : s.closing_time,
    }));

    mutation.mutate(
      { storeId, data: payload },
      {
        onSuccess: () => {
          toast.success('Horarios guardados correctamente');
        },
        onError: (error: any) => {
          const errMsg = error.response?.data?.error || 'Error al guardar los horarios';
          toast.error(errMsg);
        },
      },
    );
  };

  // Orden de visualización en Chile: Lunes (1) a Domingo (0)
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-medium">
              <th className="px-4 py-3 text-left">Día</th>
              <th className="px-4 py-3 text-center w-28">¿Cerrado?</th>
              <th className="px-4 py-3 text-left w-36">Apertura</th>
              <th className="px-4 py-3 text-left w-36">Cierre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayOrder.map((dayOfWeek) => {
              const s = schedules.find((item) => item.day_of_week === dayOfWeek);
              if (!s) return null;

              return (
                <tr
                  key={dayOfWeek}
                  className={`hover:bg-slate-50/40 transition-colors ${s.is_closed ? 'bg-slate-50/30' : ''
                    }`}
                >
                  <td
                    className={`px-4 py-3.5 font-medium transition-colors ${s.is_closed ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}
                  >
                    {DAY_NAMES[dayOfWeek]}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Switch
                      checked={s.is_closed}
                      onChange={() => handleToggleClosed(dayOfWeek)}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <input
                      type="time"
                      disabled={s.is_closed}
                      value={s.opening_time || ''}
                      onChange={(e) => handleTimeChange(dayOfWeek, 'opening_time', e.target.value)}
                      className={`h-9 px-3 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all`}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <input
                      type="time"
                      disabled={s.is_closed}
                      value={s.closing_time || ''}
                      onChange={(e) => handleTimeChange(dayOfWeek, 'closing_time', e.target.value)}
                      className={`h-9 px-3 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-all`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" loading={mutation.isPending} onClick={handleSave}>
          Guardar horarios
        </Button>
      </div>
    </div>
  );
}
