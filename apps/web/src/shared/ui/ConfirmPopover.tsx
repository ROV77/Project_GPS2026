import type { ReactNode } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/components/ui/button';

/**
 * Confirmación inline en popover (Headless UI Popover). El `children` es el
 * contenido del botón disparador; `triggerClassName` lo estiliza.
 */
export function ConfirmPopover({
  children,
  triggerClassName,
  title = '¿Confirmar esta acción?',
  confirmText = 'Eliminar',
  onConfirm,
  loading,
}: {
  children: ReactNode;
  triggerClassName?: string;
  title?: string;
  confirmText?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Popover className="relative inline-flex">
      <PopoverButton className={cn('focus:outline-hidden', triggerClassName)}>
        {children}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        transition
        className={cn(
          'z-50 w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-lg [--anchor-gap:0.5rem]',
          'transition duration-100 ease-out data-[closed]:opacity-0',
        )}
      >
        {({ close }) => (
          <div>
            <p className="mb-3 text-sm text-slate-700">{title}</p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="default" onClick={() => close()}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={loading}
                onClick={() => {
                  onConfirm();
                  close();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
