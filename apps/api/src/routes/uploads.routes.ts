import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { uploadSingle } from '../middlewares/upload';
import { uploadImage } from '../config/cloudinary';
import { HttpError } from '../lib/httpError';

export const uploadsRouter = Router();

/**
 * POST /uploads/image
 * Sube una imagen (multipart, campo "file") a Cloudinary y devuelve { url }.
 * Genérica: el frontend decide qué hacer con la URL (logo de tienda, etc.).
 */
uploadsRouter.post('/image', requireAuth, uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'No se recibió ningún archivo');
    }
    const url = await uploadImage(req.file.buffer);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});
