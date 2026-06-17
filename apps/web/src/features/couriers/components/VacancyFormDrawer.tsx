import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateVacancySchema, type CreateVacancyInput } from '@caserita/validations';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Drawer, Field, Textarea } from '@/shared/ui';
import { useCreateVacancy, useUpdateVacancy } from '../hooks/useCouriers';
import type { DeliveryVacancy } from '../types';

const emptyDefaults: Partial<CreateVacancyInput> = {
  description: '',
};

export function VacancyFormDrawer({
  open,
  vacancy,
  storeId,
  onClose,
}: {
  open: boolean;
  vacancy: DeliveryVacancy | null;
  storeId: string | undefined;
  onClose: () => void;
}) {
  const create = useCreateVacancy();
  const update = useUpdateVacancy();
  const isEdit = Boolean(vacancy);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateVacancyInput>({
    resolver: zodResolver(CreateVacancySchema) as Resolver<CreateVacancyInput>,
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (vacancy) {
      reset({
        store_id: Number(vacancy.store_id),
        description: vacancy.description ?? '',
        state_id: vacancy.state_id ? Number(vacancy.state_id) : undefined,
      });
    } else {
      reset({ ...emptyDefaults, store_id: storeId ? Number(storeId) : undefined });
    }
  }, [open, vacancy, storeId, reset]);

  const onSubmit = (values: CreateVacancyInput) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEdit ? 'Vacante actualizada' : 'Vacante publicada');
        onClose();
      },
      onError: (error: unknown) => {
        if (applyApiValidationErrors(error, setError)) return;
        toast.error(getApiErrorMessage(error));
      },
    };

    if (vacancy) update.mutate({ id: vacancy.id, data: values }, handlers);
    else create.mutate(values, handlers);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar vacante' : 'Publicar nueva vacante'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={create.isPending || update.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Guardar
          </Button>
        </div>
      }
    >
      <Field label="Descripción de la vacante (opcional)" error={errors.description?.message}>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              value={field.value ?? ''}
              onChange={field.onChange}
              rows={4}
              placeholder="Ej. Se busca repartidor con moto propia para turnos de fin de semana..."
            />
          )}
        />
      </Field>
    </Drawer>
  );
}
