import type { Area } from 'react-easy-crop';

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

/**
 * Recorta la región `area` (en px del original) de la imagen y la exporta como
 * Blob JPEG. La región es cuadrada (aspect=1), lista para mostrarse en un círculo
 * con object-cover. Patrón canvas estándar de react-easy-crop.
 */
export async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = area.width;
  canvas.height = area.height;
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
    area.width,
    area.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))),
      'image/jpeg',
      0.9,
    );
  });
}
