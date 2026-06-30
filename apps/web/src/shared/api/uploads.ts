import { api } from './client';

/**
 * Sube una imagen al backend (que la reenvía a Cloudinary) y devuelve la URL.
 * El cliente axios fija Content-Type JSON por defecto; para multipart hay que
 * borrarlo y dejar que axios ponga el boundary correcto.
 */
export async function uploadImage(file: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', file, 'logo.jpg');
  const { data } = await api.post<{ url: string }>('/uploads/image', form, {
    headers: { 'Content-Type': undefined },
  });
  return data.url;
}
