import { useRef, useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Camera, User as UserIcon, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { uploadImage } from '@/shared/api/uploads';
import { CloudinaryImg } from '@/shared/ui/CloudinaryImg';
import { getCroppedBlob } from '@/shared/lib/cropImage';
import { getInitials } from '@/shared/lib/format';
import type { Id } from '@/shared/api/types';
import { useUpdateUser } from '../hooks/useUser';

interface AvatarUploaderProps {
  userId: Id;
  value?: string;
  name: string;
}

/**
 * Editor del avatar del usuario (cualquier rol: vendedor, repartidor…). El
 * círculo muestra el avatar actual con overlay "Editar" al hover. Al abrirlo
 * aparece un modal con dropzone (arrastrar o elegir archivo) → recorte
 * (mover + zoom) → "Guardar", que sube a Cloudinary y persiste users.avatar_url
 * en una sola acción.
 */
export function AvatarUploader({ userId, value, name }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const update = useUpdateUser();

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

  const resetModal = () => {
    setImageSrc(null);
    setAreaPixels(null);
    setDragging(false);
  };

  const closeModal = () => {
    if (update.isPending) return;
    setOpen(false);
    resetModal();
  };

  const handleSave = async () => {
    if (!imageSrc || !areaPixels) return;
    try {
      const blob = await getCroppedBlob(imageSrc, areaPixels, { kind: 'avatar' });
      const url = await uploadImage(blob, 'avatar');
      await update.mutateAsync({ id: userId, data: { avatar_url: url } });
      toast.success('Foto de perfil actualizada');
      setOpen(false);
      resetModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const initials = getInitials(name);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-brand-700 text-2xl font-medium text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Editar foto de perfil"
      >
        {value ? (
          <CloudinaryImg
            src={value}
            alt={name}
            displayWidthPx={112}
            className="size-full object-cover"
          />
        ) : (
          initials || <UserIcon className="size-10" />
        )}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-5" />
          Editar
        </span>
      </button>

      <Dialog open={open} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <DialogTitle className="mb-4 text-lg font-semibold text-slate-900">
              {imageSrc ? 'Ajusta tu foto' : 'Cambiar foto de perfil'}
            </DialogTitle>

            {!imageSrc ? (
              // ─── Paso 1: dropzone / seleccionar archivo ───
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 text-center transition-colors ${
                  dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <UploadCloud className="size-10 text-slate-400" />
                <p className="text-sm text-slate-600">
                  Arrastra una imagen aquí o{' '}
                  <span className="font-medium text-brand-700">haz clic para elegir</span>
                </p>
                <p className="text-xs text-slate-400">PNG o JPG, hasta 5MB</p>
              </div>
            ) : (
              // ─── Paso 2: recorte ───
              <>
                <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-900">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="mt-4">
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
                <button
                  type="button"
                  onClick={resetModal}
                  className="mt-2 text-sm text-brand-700 hover:underline"
                  disabled={update.isPending}
                >
                  Elegir otra imagen
                </button>
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal} disabled={update.isPending}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={update.isPending}
                disabled={!imageSrc}
              >
                Guardar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleInput} />
    </>
  );
}
