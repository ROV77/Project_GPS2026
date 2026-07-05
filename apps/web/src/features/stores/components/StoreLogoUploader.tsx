import { useRef, useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Camera, Store as StoreIcon, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { uploadImage } from '@/shared/api/uploads';
import { getCroppedBlob } from '@/shared/lib/cropImage';
import type { Id } from '@/shared/api/types';
import { useUpdateStore } from '../hooks/useStores';

interface StoreLogoUploaderProps {
  storeId: Id;
  value?: string;
  /** Notifica la nueva URL para que el formulario refleje el cambio al instante. */
  onUploaded?: (url: string) => void;
}

/**
 * Editor del LOGO de la tienda (independiente del avatar del vendedor). Sube la
 * imagen a Cloudinary y persiste stores.logo_url vía PUT /stores/:id, sin tocar
 * el usuario. Recorte cuadrado, acorde a cómo se muestra el logo en la app.
 */
export function StoreLogoUploader({ storeId, value, onUploaded }: StoreLogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const update = useUpdateStore();

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
      const blob = await getCroppedBlob(imageSrc, areaPixels);
      const url = await uploadImage(blob);
      await update.mutateAsync({ id: storeId, data: { logo_url: url } });
      onUploaded?.(url);
      toast.success('Logo de la tienda actualizado');
      setOpen(false);
      resetModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex size-28 items-center justify-center overflow-hidden rounded-2xl bg-brand-700 text-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Editar logo de la tienda"
      >
        {value ? (
          <img src={value} alt="Logo de la tienda" className="size-full object-cover" />
        ) : (
          <StoreIcon className="size-10" strokeWidth={1.75} />
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
              {imageSrc ? 'Ajusta el logo' : 'Cambiar logo de la tienda'}
            </DialogTitle>

            {!imageSrc ? (
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
                  Arrastra el logo aquí o{' '}
                  <span className="font-medium text-brand-700">haz clic para elegir</span>
                </p>
                <p className="text-xs text-slate-400">PNG o JPG, hasta 5MB</p>
              </div>
            ) : (
              <>
                <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-900">
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
