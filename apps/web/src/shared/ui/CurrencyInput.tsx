import { cn } from '@/lib/utils';
import { controlBase, controlBorder } from './_control';

/**
 * Input de dinero (CLP). Muestra miles separados por punto mientras se
 * escribe (20000 → "20.000"), igual que formatCLP en el resto del panel. El
 * valor que entrega via onChange es siempre el number plano sin formato.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder,
  invalid,
  className,
}: {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}) {
  const display = value ? value.toLocaleString('es-CL') : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits === '' ? 0 : Number(digits));
  };

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder={placeholder}
        onChange={handleChange}
        className={cn(controlBase, 'h-10 pl-7', controlBorder(invalid))}
      />
    </div>
  );
}
