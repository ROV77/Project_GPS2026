import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  /** Adorno a la izquierda (p. ej. un ícono). */
  prefix?: ReactNode;
}

/** Campo de texto. `invalid` pinta el borde de error; `prefix` agrega un adorno. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, prefix, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground',
        'focus:border-ring focus:outline-hidden focus:ring-2 focus:ring-ring/40',
        'disabled:bg-muted disabled:text-muted-foreground',
        invalid ? 'border-destructive' : 'border-input',
        prefix && 'pl-9',
        className,
      )}
      {...props}
    />
  );
  if (!prefix) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {prefix}
      </span>
      {input}
    </div>
  );
});
