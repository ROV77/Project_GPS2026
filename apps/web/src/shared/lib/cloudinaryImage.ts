const CLOUDINARY_UPLOAD = '/image/upload/';

export type ImageUploadKind = 'avatar' | 'store_logo' | 'product';

/** Tamaños máximos al exportar el recorte en el cliente (antes de subir). */
export const CLIENT_CROP_MAX_SIZE: Record<ImageUploadKind, number> = {
  avatar: 256,
  store_logo: 512,
  product: 800,
};

export interface OptimizeCloudinaryOptions {
  width?: number;
  height?: number;
  quality?: string;
}

function hasDeliveryTransform(pathAfterUpload: string): boolean {
  const first = pathAfterUpload.split('/')[0] ?? '';
  return first.includes(',') || /^[whfqcgd]_/.test(first);
}

/**
 * Inserta transformaciones de entrega en una URL de Cloudinary (w_, q_auto, f_auto).
 * URLs que no son de Cloudinary se devuelven sin cambios.
 */
export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  options: OptimizeCloudinaryOptions = {},
): string | undefined {
  if (!url?.trim()) return undefined;

  const trimmed = url.trim();
  if (!trimmed.includes('res.cloudinary.com')) return trimmed;

  const uploadIdx = trimmed.indexOf(CLOUDINARY_UPLOAD);
  if (uploadIdx === -1) return trimmed;

  const afterUpload = trimmed.slice(uploadIdx + CLOUDINARY_UPLOAD.length);
  if (hasDeliveryTransform(afterUpload)) return trimmed;

  const { width, height, quality = 'auto' } = options;
  const transforms = ['c_limit'];
  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  transforms.push(`q_${quality}`, 'f_auto');

  const chain = transforms.join(',');
  return trimmed.replace(CLOUDINARY_UPLOAD, `${CLOUDINARY_UPLOAD}${chain}/`);
}

/** Ancho de entrega ~2× el tamaño en pantalla (retina). */
export function displayWidth(cssPx: number): number {
  return Math.max(64, Math.round(cssPx * 2));
}
