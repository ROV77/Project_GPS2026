import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateStoreSchema, type UpdateStoreInput } from '@caserita/validations';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Card, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/shared/ui';
import { useMyStore, useUpdateStore } from '../hooks/useStores';
import { ScheduleEditor } from '../components/ScheduleEditor';

/**
 * "Mi Tienda": una cuenta administra una sola tienda. Esta página carga esa
 * tienda y permite editar los datos que el cliente verá en la app mobile. Usa
 * updateStoreSchema (campos parciales) porque es una edición, no un alta.
 */
export function MyStorePage() {
  const { data: store, isLoading } = useMyStore();
  const update = useUpdateStore();
  const categories = useCatalogOptions('categories');
  const regions = useCatalogOptions('regions');
  const communes = useCatalogOptions('communes');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateStoreInput>({
    resolver: zodResolver(updateStoreSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (!store) return;
    reset({
      name: store.name,
      description: store.description ?? '',
      category_id: store.category_id ? Number(store.category_id) : undefined,
      region_id: store.region_id ? Number(store.region_id) : undefined,
      commune_id: store.commune_id ? Number(store.commune_id) : undefined,
      logo_url: store.logo_url ?? '',
      store_phone: store.store_phone ?? '',
    });
  }, [store, reset]);

  const onSubmit = (values: UpdateStoreInput) => {
    if (!store) return;
    update.mutate(
      { id: store.id, data: values },
      {
        onSuccess: () => toast.success('Tienda actualizada'),
        onError: (error) => {
          if (applyApiValidationErrors(error, setError)) return;
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Mi Tienda"
        subtitle="Datos de tu comercio, visibles para los clientes en la app"
      />
      <Card className="max-w-2xl">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        ) : !store ? (
          <EmptyState description="Aún no hay una tienda asociada a esta cuenta" />
        ) : (
          <div>
            <Field label="Nombre" required error={errors.name?.message}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input value={field.value ?? ''} onChange={field.onChange} invalid={!!errors.name} />
                )}
              />
            </Field>

            <Field label="Descripción">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    rows={3}
                    placeholder="Cuéntale a tus clientes qué ofreces"
                  />
                )}
              />
            </Field>

            <Field label="Categoría">
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : null}
                    onChange={(v) => field.onChange(v ?? undefined)}
                    options={categories.options}
                    loading={categories.isLoading}
                    placeholder="Sin categoría"
                    allowClear
                  />
                )}
              />
            </Field>

            <Field label="Región">
              <Controller
                name="region_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : null}
                    onChange={(v) => field.onChange(v ?? undefined)}
                    options={regions.options}
                    loading={regions.isLoading}
                    placeholder="Sin región"
                    allowClear
                  />
                )}
              />
            </Field>

            <Field label="Comuna">
              <Controller
                name="commune_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : null}
                    onChange={(v) => field.onChange(v ?? undefined)}
                    options={communes.options}
                    loading={communes.isLoading}
                    placeholder="Sin comuna"
                    allowClear
                  />
                )}
              />
            </Field>

            <Field label="Teléfono">
              <Controller
                name="store_phone"
                control={control}
                render={({ field }) => (
                  <Input value={field.value ?? ''} onChange={field.onChange} placeholder="+56 9 ..." />
                )}
              />
            </Field>

            <Field label="Logo (URL)">
              <Controller
                name="logo_url"
                control={control}
                render={({ field }) => (
                  <Input value={field.value ?? ''} onChange={field.onChange} placeholder="https://..." />
                )}
              />
            </Field>

            <Button variant="primary" loading={update.isPending} onClick={handleSubmit(onSubmit)}>
              Guardar cambios
            </Button>
          </div>
        )}
      </Card>

      {store && (
        <Card className="max-w-2xl mt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Horarios de atención</h3>
          <ScheduleEditor storeId={store.id} />
        </Card>
      )}
    </>
  );
}
