import { useState } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, controlBorder } from '@/shared/ui/_control';
import { NumberInput } from '@/shared/ui';

const STOCK_PRESETS = [10, 20, 30, 40, 50];

/**
 * Selector de stock con cantidades predeterminadas (10/20/30/40/50) en un
 * <select>, para el caso común de reponer en lotes redondos. La opción
 * "Cantidad personalizada" revela un NumberInput libre, necesaria para
 * cualquier otro valor (incluyendo el de productos ya existentes cuyo stock
 * no calza con ninguna de las predeterminadas).
 */
export function StockSelect({
  value,
  onChange,
  invalid,
}: {
  value?: number;
  onChange: (value: number) => void;
  invalid?: boolean;
}) {
  const isPreset = value != null && STOCK_PRESETS.includes(value);
  const [custom, setCustom] = useState(!isPreset);

  if (custom) {
    return (
      <div className="flex items-center gap-2">
        <NumberInput min={0} value={value} onChange={onChange} invalid={invalid} />
        <button
          type="button"
          onClick={() => setCustom(false)}
          className="shrink-0 text-sm text-brand-700 hover:underline"
        >
          Usar predeterminada
        </button>
      </div>
    );
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === 'custom') {
          setCustom(true);
          return;
        }
        onChange(Number(e.target.value));
      }}
      className={cn(controlBase, 'h-10', controlBorder(invalid))}
    >
      <option value="" disabled>
        Selecciona una cantidad
      </option>
      {STOCK_PRESETS.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
      <option value="custom">Cantidad personalizada...</option>
    </select>
  );
}
