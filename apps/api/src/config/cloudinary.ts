import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { HttpError } from '../lib/httpError';

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Sube un buffer de imagen a Cloudinary y devuelve su secure_url.
 * Usa upload_stream (la API de buffer de Cloudinary es por stream) envuelto en
 * una Promise. Si faltan credenciales, lanza 503 en vez de fallar opacamente.
 */
export function uploadImage(buffer: Buffer): Promise<string> {
  if (!isConfigured) {
    throw new HttpError(503, 'Cloudinary no configurado: define las variables CLOUDINARY_* en el .env');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        resource_type: 'image',
        // Compresión no destructiva: limita el lado mayor a 1024px (solo reduce
        // si es más grande, conserva proporción) y deja que Cloudinary elija
        // calidad y formato óptimos. Baja mucho el peso sin recortar la imagen.
        transformation: [{ width: 1024, height: 1024, crop: 'limit' }],
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary no devolvió resultado'));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
