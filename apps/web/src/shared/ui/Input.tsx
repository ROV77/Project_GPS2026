import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { controlBase, controlBorder } from './_control';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  /** Adorno a la izquierda (p. ej. un ícono). */
  prefix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, prefix, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      className={cn(controlBase, 'h-10', controlBorder(invalid), prefix && 'pl-9', className)}
      {...props}
    />
  );
  if (!prefix) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {prefix}
      </span>
      {input}
    </div>
  );
});
