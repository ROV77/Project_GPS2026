import multer from 'multer';
import { HttpError } from '../lib/httpError';

/**
 * Recibe un único archivo de imagen en memoria (para reenviarlo a Cloudinary sin
 * tocar el disco). Límite 5MB y solo mimetypes de imagen.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'El archivo debe ser una imagen'));
    }
  },
});

export const uploadSingle = upload.single('file');
