import type { ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/**
 * Panel lateral (slide-over) sobre el Dialog accesible de Headless UI.
 * Maneja foco, ESC y click-fuera por defecto.
 */
export function Drawer({
  open,
  onClose,
  title,
  footer,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel
          transition
          className={cn(
            'flex h-full w-full flex-col bg-white shadow-xl transition-transform duration-300 ease-out data-[closed]:translate-x-full',
            width,
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-base font-semibold text-slate-800">{title}</DialogTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer && <div className="border-t border-slate-200 px-5 py-3">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
