/** Tipos de imagen subida — define carpeta y tamaño máximo en Cloudinary. */
export const IMAGE_UPLOAD_KINDS = ['avatar', 'store_logo', 'product'] as const;

export type ImageUploadKind = (typeof IMAGE_UPLOAD_KINDS)[number];

export interface ImageUploadPreset {
  folder: string;
  maxSize: number;
}

export const IMAGE_UPLOAD_PRESETS: Record<ImageUploadKind, ImageUploadPreset> = {
  avatar: { folder: 'avatars', maxSize: 256 },
  store_logo: { folder: 'stores', maxSize: 512 },
  product: { folder: 'products', maxSize: 800 },
};

export function parseImageUploadKind(value: unknown): ImageUploadKind {
  if (typeof value === 'string' && IMAGE_UPLOAD_KINDS.includes(value as ImageUploadKind)) {
    return value as ImageUploadKind;
  }
  return 'product';
}
