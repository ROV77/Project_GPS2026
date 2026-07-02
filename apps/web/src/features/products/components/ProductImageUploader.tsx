import { useRef, useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Camera, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { uploadImage } from '@/shared/api/uploads';
import { getCroppedBlob } from '@/shared/lib/cropImage';

interface ProductImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
}

/**
 * Editor de la foto del producto. Misma lógica de subida que AvatarUploader
 * (features/user/components/AvatarUploader.tsx): elegir/arrastrar archivo →
 * recorte (mover + zoom) → "Usar imagen", que sube el recorte a Cloudinary vía
 * POST /uploads/image y devuelve la URL ya alojada.
 *
 * A diferencia del avatar, todo se renderiza INLINE dentro del Drawer del
 * formulario (sin Dialog propio — el Drawer ya es un Dialog de Headless UI, y
 * anidar otro encima rompía el flujo). El recorte es cuadrado (no circular,
 * igual que ProductThumb) y no persiste nada por su cuenta: solo sube la
 * imagen y entrega la URL via onChange, para que quede en el estado del
 * formulario (react-hook-form) y se guarde junto con el resto de los campos
 * al enviar el Drawer.
 */
export function ProductImageUploader({ value, onChange }: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const cancelCrop = () => {
    setImageSrc(null);
    setAreaPixels(null);
  };

  const handleSave = async () => {
    if (!imageSrc || !areaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      const url = await uploadImage(blob);
      onChange(url);
      setImageSrc(null);
      setAreaPixels(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  // ─── Paso de recorte: reemplaza el dropzone mientras hay una imagen elegida ───
  if (imageSrc) {
    return (
      <div>
        <div className="relative h-56 w-full overflow-hidden rounded-lg bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm text-slate-600">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-700"
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="default" onClick={cancelCrop} disabled={uploading}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} loading={uploading}>
            Usar imagen
          </Button>
        </div>
      </div>
    );
  }

  // ─── Estado normal: dropzone grande (vacía) o preview a ancho completo ───
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={value ? 'Cambiar imagen del producto' : 'Elegir imagen del producto'}
        className={`group relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500 ${
          value
            ? 'border border-slate-200'
            : `border-2 border-dashed ${dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5" />
              Cambiar imagen
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center">
            <UploadCloud className="size-8 text-slate-400" />
            <span className="text-sm text-slate-600">
              Arrastra una imagen aquí o{' '}
              <span className="font-medium text-brand-700">haz clic para elegir</span>
            </span>
            <span className="text-xs text-slate-400">PNG o JPG, hasta 5MB</span>
          </span>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleInput} />
    </div>
  );
}
