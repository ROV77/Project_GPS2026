const CLOUDINARY_UPLOAD = '/image/upload/';

export interface OptimizeCloudinaryOptions {
  width?: number;
  height?: number;
  quality?: string;
}

function hasDeliveryTransform(pathAfterUpload: string): boolean {
  const first = pathAfterUpload.split('/')[0] ?? '';
  return first.includes(',') || /^[whfqcgd]_/.test(first);
}

/** Inserta transformaciones de entrega en URLs de Cloudinary. */
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
