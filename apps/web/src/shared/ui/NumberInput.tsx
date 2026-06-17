import { cn } from '@/lib/utils';
import { controlBase, controlBorder } from './_control';

/** Input numérico controlado. Vacío → 0. */
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
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className={cn(controlBase, 'h-10', controlBorder(invalid), className)}
    />
  );
}
