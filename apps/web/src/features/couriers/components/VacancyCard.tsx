import { Briefcase, Calendar, Pencil } from 'lucide-react';
import { ConfirmDelete } from '@/shared/components/ConfirmDelete';
import { Button } from '@/shared/ui';
import { formatDate } from '@/shared/lib/format';
import type { DeliveryVacancy } from '../types';

interface VacancyCardProps {
  vacancy: DeliveryVacancy;
  onEdit: (vacancy: DeliveryVacancy) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function VacancyCard({ vacancy, onEdit, onDelete, deleting }: VacancyCardProps) {
  const description = vacancy.description?.trim() || 'Sin descripción';

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-brand-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Briefcase className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-4 text-sm leading-relaxed text-foreground">{description}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            Publicada el {formatDate(vacancy.created_at)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          size="sm"
          variant="default"
          icon={<Pencil className="size-4" />}
          onClick={() => onEdit(vacancy)}
        >
          Editar
        </Button>
        <ConfirmDelete
          title="¿Eliminar esta vacante?"
          onConfirm={() => onDelete(vacancy.id)}
          loading={deleting}
        />
      </div>
    </article>
  );
}
