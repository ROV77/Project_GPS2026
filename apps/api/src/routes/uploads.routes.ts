import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { uploadSingle } from '../middlewares/upload';
import { uploadImage } from '../config/cloudinary';
import { parseImageUploadKind } from '../config/image-upload';
import { HttpError } from '../lib/httpError';

export const uploadsRouter = Router();

/**
 * POST /uploads/image?kind=avatar|store_logo|product
 * Sube una imagen (multipart, campo "file") a Cloudinary y devuelve { url }.
 */
uploadsRouter.post('/image', requireAuth, uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'No se recibió ningún archivo');
    }
    const kind = parseImageUploadKind(req.query.kind);
    const url = await uploadImage(req.file.buffer, kind);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});
