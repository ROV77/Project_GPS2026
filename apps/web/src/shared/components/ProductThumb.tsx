import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/format';
import { displayWidth, optimizeCloudinaryUrl } from '@/shared/lib/cloudinaryImage';

const SIZE_CLASS = {
  sm: 'size-9 text-xs',
  md: 'size-14 text-sm',
  lg: 'size-full text-lg',
} as const;

const SIZE_PX = {
  sm: 36,
  md: 56,
  lg: 320,
} as const;

/**
 * Miniatura cuadrada de un producto. Usa `image_url` si existe; si no, iniciales
 * o icono sobre fondo muted.
 */
export function ProductThumb({
  src,
  alt,
  className,
  size = 'sm',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const sizeClass = SIZE_CLASS[size];
  const optimized = optimizeCloudinaryUrl(src, { width: displayWidth(SIZE_PX[size]) });

  if (optimized) {
    return (
      <img
        src={optimized}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'rounded-md border border-border object-cover',
          size !== 'lg' && sizeClass,
          className,
        )}
      />
    );
  }

  const initials = getInitials(alt);

  return (
    <div
      aria-hidden={!initials}
      aria-label={initials ? alt : undefined}
      className={cn(
        'flex items-center justify-center rounded-md border border-border bg-muted font-semibold text-muted-foreground',
        size !== 'lg' && sizeClass,
        initials ? 'bg-brand-50 text-brand-700' : '',
        className,
      )}
    >
      {initials || <Package className={size === 'sm' ? 'size-4' : 'size-6'} />}
    </div>
  );
}
