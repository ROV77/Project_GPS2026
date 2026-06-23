import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Store as StoreIcon } from 'lucide-react';
import { storeProfileSchema, type StoreProfileInput } from '@caserita/validations';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Card, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/shared/ui';
import { useMyStore, useUpdateStore } from '../hooks/useStores';
import { MapPicker } from '../components/MapPicker';

/** Iniciales (1–2 letras) a partir del nombre; fallback con un icono. */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return '';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * "Mi Tienda": una cuenta administra una sola tienda. Los datos del perfil son
 * obligatorios (el cliente los ve en la app mobile); el logo es opcional. Usa
 * storeProfileSchema (campos requeridos + logo opcional aceptando '').
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreProfileInput>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {},
  });

  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');

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
      latitude: store.latitude ? Number(store.latitude) : undefined,
      longitude: store.longitude ? Number(store.longitude) : undefined,
    });
  }, [store, reset]);

  const onSubmit = (values: StoreProfileInput) => {
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

  const logoUrl = watch('logo_url');
  const initials = getInitials(store?.name);

  return (
    <>
      <PageHeader
        title="Mi Tienda"
        subtitle="Datos de tu comercio, visibles para los clientes en la app"
      />
      <Card className="max-w-4xl">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full md:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !store ? (
          <EmptyState description="Aún no hay una tienda asociada a esta cuenta" />
        ) : (
          <div>
            {/* Encabezado con preview del logo */}
            <div className="mb-6 flex items-center gap-4 border-b border-border pb-5">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-brand-700 font-medium text-white">
                {logoUrl ? (
                  <img src={logoUrl} alt={store.name} className="size-full object-cover" />
                ) : (
                  initials || <StoreIcon className="size-6" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{store.name}</p>
                <p className="text-sm text-muted-foreground">
                  El logo es opcional; el resto de los datos son obligatorios.
                </p>
              </div>
            </div>

            <div className="grid gap-x-6 md:grid-cols-2">
              <Field label="Nombre" required error={errors.name?.message}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input value={field.value ?? ''} onChange={field.onChange} invalid={!!errors.name} />
                  )}
                />
              </Field>

              <Field label="Teléfono" required error={errors.store_phone?.message}>
                <Controller
                  name="store_phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      invalid={!!errors.store_phone}
                      placeholder="+56 9 ..."
                    />
                  )}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Descripción" required error={errors.description?.message}>
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
              </div>

              <Field label="Categoría" required error={errors.category_id?.message}>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : null}
                      onChange={(v) => field.onChange(v ?? undefined)}
                      options={categories.options}
                      loading={categories.isLoading}
                      placeholder="Selecciona una categoría"
                    />
                  )}
                />
              </Field>

              <Field label="Región" required error={errors.region_id?.message}>
                <Controller
                  name="region_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : null}
                      onChange={(v) => field.onChange(v ?? undefined)}
                      options={regions.options}
                      loading={regions.isLoading}
                      placeholder="Selecciona una región"
                    />
                  )}
                />
              </Field>

              <Field label="Comuna" required error={errors.commune_id?.message}>
                <Controller
                  name="commune_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : null}
                      onChange={(v) => field.onChange(v ?? undefined)}
                      options={communes.options}
                      loading={communes.isLoading}
                      placeholder="Selecciona una comuna"
                    />
                  )}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Logo (URL)" error={errors.logo_url?.message}>
                  <Controller
                    name="logo_url"
                    control={control}
                    render={({ field }) => (
                      <Input
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        invalid={!!errors.logo_url}
                        placeholder="https://..."
                      />
                    )}
                  />
                </Field>
              </div>
            </div>

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

            <div className="my-6">
              <MapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                onChange={({ lat, lng }) => {
                  setValue('latitude', lat, { shouldDirty: true, shouldValidate: true });
                  setValue('longitude', lng, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>

            <Button variant="primary" loading={update.isPending} onClick={handleSubmit(onSubmit)}>
              Guardar cambios
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
