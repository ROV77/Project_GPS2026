import { displayWidth, optimizeCloudinaryUrl } from '@/shared/lib/cloudinaryImage';

interface CloudinaryImgProps {
  src?: string | null;
  alt: string;
  /** Ancho CSS aproximado en px — se sirve ~2× para retina. */
  displayWidthPx: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

/** Imagen remota con transformaciones Cloudinary para carga liviana. */
export function CloudinaryImg({
  src,
  alt,
  displayWidthPx,
  className,
  loading = 'lazy',
  onError,
}: CloudinaryImgProps) {
  const optimized = optimizeCloudinaryUrl(src, { width: displayWidth(displayWidthPx) });
  if (!optimized) return null;

  return (
    <img
      src={optimized}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={onError}
      className={className}
    />
  );
}

/** URL optimizada para modales / vista previa (mayor resolución). */
export function optimizeImagePreviewUrl(src?: string | null): string | undefined {
  return optimizeCloudinaryUrl(src, { width: 800 });
}
