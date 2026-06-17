import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Miniatura cuadrada de un producto. Usa `image_url` si existe; si no, muestra
 * un placeholder por defecto (icono sobre fondo muted). Reutilizable en la
 * tabla de Productos y en la tarjeta de Destacados del dashboard.
 */
export function ProductThumb({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn('size-9 rounded-md border border-border object-cover', className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      <Package className="size-4" />
    </div>
  );
}
