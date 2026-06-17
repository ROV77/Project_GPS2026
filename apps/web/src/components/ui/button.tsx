import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Botón del panel. Estilado con los tokens semánticos (primary, destructive,
 * muted…) que apuntan a la marca navy. La API (variant/size/loading/icon) se
 * mantiene igual que el kit anterior para no romper a los consumidores.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors ' +
    'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
    'disabled:cursor-not-allowed disabled:opacity-70',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-brand-800 disabled:bg-brand-300',
        default: 'border border-input bg-card text-foreground hover:bg-muted',
        danger: 'bg-destructive text-white hover:bg-red-700 disabled:bg-red-300',
        ghost: 'text-muted-foreground hover:bg-muted',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3 text-sm',
        md: 'h-10 gap-2 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant,
  size,
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export { buttonVariants };
