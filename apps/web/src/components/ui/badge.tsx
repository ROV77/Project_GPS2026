import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Etiqueta tipo "pill" con tonos de color. */
const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        gray: 'bg-slate-100 text-slate-600',
        green: 'bg-green-100 text-green-700',
        gold: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
        blue: 'bg-blue-100 text-blue-700',
      },
    },
    defaultVariants: {
      tone: 'gray',
    },
  },
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: ReactNode;
}

export function Badge({ tone, className, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

export { badgeVariants };
