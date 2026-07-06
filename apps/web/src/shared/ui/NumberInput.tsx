import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { controlBase, controlBorder } from './_control';

function formatNumberText(value?: number): string {
  if (value == null || Number.isNaN(value)) return '';
  return String(value);
}

/** Normaliza dígitos escritos a mano: "04" → "4", "034" → "34". */
function normalizeIntegerInput(raw: string): string {
  if (raw === '') return '';
  if (!/^\d*$/.test(raw)) return raw.replace(/\D/g, '');
  if (raw.length <= 1) return raw;
  return raw.replace(/^0+/, '') || '0';
}

/** Input numérico controlado. Vacío → 0. Usa texto local para evitar ceros a la izquierda al tipear. */
export function NumberInput({
  value,
  onChange,
  min,
  placeholder,
  invalid,
  className,
}: {
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(() => formatNumberText(value));
  const lastExternal = useRef(value);

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setText(formatNumberText(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = normalizeIntegerInput(e.target.value);
    setText(raw);

    const num = raw === '' ? 0 : Number(raw);
    const clamped = min != null ? Math.max(min, num) : num;

    lastExternal.current = clamped;
    onChange(clamped);
  };

  const handleBlur = () => {
    const normalized = formatNumberText(value);
    setText(normalized);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      value={text}
      placeholder={placeholder}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(controlBase, 'h-10', controlBorder(invalid), className)}
    />
  );
}
