import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { HttpError } from '../lib/httpError';
import {
  IMAGE_UPLOAD_PRESETS,
  type ImageUploadKind,
} from './image-upload';

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
 * Sube un buffer de imagen a Cloudinary y devuelve su secure_url (sin transformaciones
 * de entrega — el cliente añade w_/q_/f_ al mostrar).
 */
export function uploadImage(buffer: Buffer, kind: ImageUploadKind = 'product'): Promise<string> {
  if (!isConfigured) {
    throw new HttpError(503, 'Cloudinary no configurado: define las variables CLOUDINARY_* en el .env');
  }

  const preset = IMAGE_UPLOAD_PRESETS[kind];

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: preset.folder,
        resource_type: 'image',
        transformation: [{ width: preset.maxSize, height: preset.maxSize, crop: 'limit' }],
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
