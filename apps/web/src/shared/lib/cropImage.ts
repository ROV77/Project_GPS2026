import type { Area } from 'react-easy-crop';
import type { ImageUploadKind } from './cloudinaryImage';
import { CLIENT_CROP_MAX_SIZE } from './cloudinaryImage';

/** Carga una imagen desde una URL/dataURL y resuelve cuando está lista. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface CropImageOptions {
  /** Lado mayor máximo del export (px). */
  maxSize?: number;
  /** Tipo de imagen — usa el máximo por defecto del preset. */
  kind?: ImageUploadKind;
  quality?: number;
}

/**
 * Recorta la región `area` (en px del original) y exporta JPEG optimizado,
 * escalando si el recorte supera `maxSize`.
 */
export async function getCroppedBlob(
  imageSrc: string,
  area: Area,
  options: CropImageOptions = {},
): Promise<Blob> {
  const maxSize =
    options.maxSize ?? (options.kind ? CLIENT_CROP_MAX_SIZE[options.kind] : 1024);
  const quality = options.quality ?? 0.85;

  const image = await loadImage(imageSrc);
  const longest = Math.max(area.width, area.height);
  const scale = longest > maxSize ? maxSize / longest : 1;
  const outW = Math.max(1, Math.round(area.width * scale));
  const outH = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el contexto de canvas');

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      'image/jpeg',
      quality,
    );
  });
}
