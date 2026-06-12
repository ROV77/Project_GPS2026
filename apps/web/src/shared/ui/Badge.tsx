import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'gray' | 'green' | 'gold' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-600',
  green: 'bg-green-100 text-green-700',
  gold: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};

/** Etiqueta tipo "pill" con tonos de color. */
export function Badge({
  tone = 'gray',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
