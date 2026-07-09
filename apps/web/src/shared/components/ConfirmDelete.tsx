import { Trash2 } from 'lucide-react';
import { ConfirmPopover } from '@/shared/ui';

/**
 * Botón de eliminar con confirmación. Centraliza el patrón ConfirmPopover + botón
 * danger usado en todas las tablas, para no repetir textos ni estilos.
 */
export function ConfirmDelete({
  title = '¿Eliminar este registro?',
  onConfirm,
  loading,
}: {
  title?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <ConfirmPopover
      title={title}
      onConfirm={onConfirm}
      loading={loading}
      triggerClassName="inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 text-red-600 hover:bg-red-50"
    >
      <Trash2 className="size-4" />
    </ConfirmPopover>
  );
}
