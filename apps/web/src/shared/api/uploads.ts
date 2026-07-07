import { api } from './client';
import type { ImageUploadKind } from '@/shared/lib/cloudinaryImage';

/**
 * Sube una imagen al backend (Cloudinary) y devuelve la URL almacenable.
 * `kind` define carpeta y tamaño máximo en el servidor.
 */
export async function uploadImage(
  file: Blob,
  kind: ImageUploadKind = 'product',
): Promise<string> {
  const form = new FormData();
  form.append('file', file, `${kind}.jpg`);
  const { data } = await api.post<{ url: string }>(`/uploads/image?kind=${kind}`, form, {
    headers: { 'Content-Type': undefined },
  });
  return data.url;
}
