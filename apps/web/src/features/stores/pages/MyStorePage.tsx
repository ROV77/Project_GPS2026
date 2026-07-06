import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { storeProfileSchema, type StoreProfileInput } from '@caserita/validations';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { useCommunesByRegion } from '@/shared/hooks/useCommunesByRegion';
import { api } from '@/shared/api/client';
import type { Id } from '@/shared/api/types';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Card, EmptyState, Field, Input, Select, Skeleton, Textarea } from '@/shared/ui';
import { useMyStore, useUpdateStore } from '../hooks/useStores';
import { useMySubscription } from '@/features/subscriptions/hooks/useSubscription';
import { StoreLogoUploader } from '../components/StoreLogoUploader';
import { MapPicker } from '../components/MapPicker';
import { StoreMobilePreview } from '../components/StoreMobilePreview';
import type { StorePreviewData } from '../components/StoreMobilePreview';
import { ScheduleEditor } from '../components/ScheduleEditor';
import { getStoreLocationMetadata } from '../lib/storeMetadata';
import { resolveCommuneId, resolveRegionId } from '../lib/resolveCatalogLocation';
import { geocodeCommune } from '../lib/geocoding';
import type { StoreLocation } from '../types/location';
function findOptionLabel(
  options: Array<{ value: string; label: string }>,
  id?: number | string | null,
): string {
  if (id == null || id === '') return '';
  const idStr = String(id);
  return options.find((option) => option.value === idStr || String(option.value) === idStr)?.label ?? '';
}

/**
 * "Mi Tienda": una cuenta administra una sola tienda. Los datos del perfil son
 * obligatorios (el cliente los ve en la app mobile); el logo es opcional. Usa
 * storeProfileSchema (campos requeridos + logo opcional aceptando '').
 */
export function MyStorePage() {
  const { data: store, isLoading } = useMyStore();
  const { data: subscription } = useMySubscription();
  const update = useUpdateStore();
  const categories = useCatalogOptions('categories');
  const regions = useCatalogOptions('regions');
  const [manualLocation, setManualLocation] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreProfileInput>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      name: '',
      description: '',
      store_phone: '',
      logo_url: '',
    } as StoreProfileInput,
  });

  const watchedRegionId = watch('region_id');
  const communes = useCommunesByRegion(
    watchedRegionId != null ? String(watchedRegionId) : null,
  );

  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');
  const watchedAddress = watch('address');
  const watchedStreet = watch('address_street');
  const watchedNumber = watch('address_number');
  const watchedCommuneId = watch('commune_id');
  const watchedName = watch('name');
  const watchedDescription = watch('description');
  const watchedCategoryId = watch('category_id');
  const watchedLogoUrl = watch('logo_url');

  const selectedRegionLabel = findOptionLabel(regions.options, watchedRegionId);
  const selectedCommuneLabel = findOptionLabel(communes.options, watchedCommuneId);
  const selectedCategoryLabel = findOptionLabel(categories.options, watchedCategoryId);

  const previewData = useMemo<StorePreviewData>(
    () => ({
      name: watchedName ?? store?.name ?? '',
      description: watchedDescription ?? store?.description ?? '',
      categoryName: selectedCategoryLabel,
      logoUrl: watchedLogoUrl || store?.logo_url,
      address: watchedAddress,
      addressStreet: watchedStreet,
      addressNumber: watchedNumber,
      communeName: selectedCommuneLabel,
      regionName: selectedRegionLabel,
      latitude: watchedLat,
      longitude: watchedLng,
      // El badge de verificado es exclusivo de Premium (capacidad del plan).
      verified: subscription?.capabilities.verifiedBadge ?? false,
    }),
    [
      selectedCategoryLabel,
      selectedCommuneLabel,
      selectedRegionLabel,
      store?.description,
      store?.logo_url,
      store?.name,
      subscription?.capabilities.verifiedBadge,
      watchedAddress,
      watchedCategoryId,
      watchedDescription,
      watchedLat,
      watchedLng,
      watchedLogoUrl,
      watchedName,
      watchedNumber,
      watchedStreet,
    ],
  );

  useEffect(() => {
    if (!store) return;
    const locationMeta = getStoreLocationMetadata(store.metadata);
    const hasCoords = store.latitude != null && store.longitude != null;

    reset({
      name: store.name,
      description: store.description ?? '',
      category_id: store.category_id ? Number(store.category_id) : undefined,
      region_id: store.region_id ? Number(store.region_id) : undefined,
      commune_id: store.commune_id ? Number(store.commune_id) : undefined,
      logo_url: store.logo_url ?? '',
      store_phone: store.store_phone ?? '',
      latitude: hasCoords ? Number(store.latitude) : undefined,
      longitude: hasCoords ? Number(store.longitude) : undefined,
      address: locationMeta.address,
      address_street: locationMeta.street,
      address_number: locationMeta.number,
    });
  }, [store, reset]);

  const centerMapOnCommune = useCallback(
    async (communeLabel: string, regionLabel: string) => {
      const geo = await geocodeCommune(communeLabel, regionLabel);
      if (!geo) return;
      setValue('latitude', geo.lat, { shouldDirty: true, shouldValidate: true });
      setValue('longitude', geo.lng, { shouldDirty: true, shouldValidate: true });
      clearErrors(['latitude', 'longitude']);
    },
    [clearErrors, setValue],
  );

  const applyMapLocation = useCallback(
    (location: StoreLocation) => {
      setValue('latitude', location.lat, { shouldDirty: true, shouldValidate: true });
      setValue('longitude', location.lng, { shouldDirty: true, shouldValidate: true });
      setValue('address', location.address, { shouldDirty: true });
      setValue('address_street', location.street, { shouldDirty: true });
      setValue('address_number', location.number, { shouldDirty: true });
      clearErrors(['latitude', 'longitude']);
    },
    [clearErrors, setValue],
  );

  // Deriva región/comuna del catálogo a partir de la dirección confirmada en el mapa.
  const syncCatalogFromLocation = useCallback(
    async (location: StoreLocation) => {
      if (!location.communeName) {
        setValue('region_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        setValue('commune_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        return;
      }

      const regionId = resolveRegionId(location.regionName, regions.options);
      if (!regionId) {
        setValue('region_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        setValue('commune_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        setError('commune_id', {
          type: 'manual',
          message: 'No pudimos asociar esta dirección a una región del catálogo.',
        });
        return;
      }

      const regionCommunes = await api
        .get<Array<{ id: Id; name: string }>>(`/regions/${regionId}/communes`)
        .then((response) => response.data);

      const communeOptions = regionCommunes.map((commune) => ({
        value: String(commune.id),
        label: commune.name,
      }));

      const communeId = resolveCommuneId(location.communeName, communeOptions);
      if (!communeId) {
        setValue('region_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        setValue('commune_id', undefined as unknown as number, { shouldDirty: true, shouldValidate: true });
        setError('commune_id', {
          type: 'manual',
          message: `La comuna "${location.communeName}" no está en el catálogo. Ajusta el pin o elige otra dirección.`,
        });
        return;
      }

      setValue('region_id', regionId, { shouldDirty: true, shouldValidate: true });
      setValue('commune_id', communeId, { shouldDirty: true, shouldValidate: true });
      clearErrors(['region_id', 'commune_id']);
    },
    [clearErrors, regions.options, setError, setValue],
  );

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

  return (
    <>
      <PageHeader
        title="Mi Tienda"
        subtitle="Datos de tu comercio, visibles para los clientes en la app"
      />

      <div className="flex w-full flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
        <div className="min-w-0 flex-1 space-y-6">
      <Card>
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
            {/* Encabezado con editor del logo de la tienda (independiente del vendedor) */}
            <div className="mb-6 flex items-center gap-5 border-b border-border pb-5">
              <StoreLogoUploader
                storeId={store.id}
                value={watchedLogoUrl || store.logo_url || undefined}
                onUploaded={(url) =>
                  setValue('logo_url', url, { shouldDirty: false, shouldValidate: true })
                }
              />
              <div>
                <p className="font-medium text-foreground">{store.name}</p>
                <p className="text-sm text-muted-foreground">
                  Este es el logo de tu tienda: es lo que verán los clientes en la app.
                  Pasa el mouse sobre él y haz clic para cambiarlo.
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

              <Field label="Categoría" required error={errors.category_id?.message} className="md:col-span-2">
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : null}
                      onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                      options={categories.options}
                      loading={categories.isLoading}
                      placeholder="Selecciona una categoría"
                    />
                  )}
                />
              </Field>
            </div>

            <div className="my-6">
              <MapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                address={watchedAddress}
                addressStreet={watchedStreet}
                addressNumber={watchedNumber}
                // En modo automático busca en todo Chile; no sesgar por RM/Santiago guardados.
                communeName={manualLocation ? selectedCommuneLabel || undefined : undefined}
                regionName={manualLocation ? selectedRegionLabel || undefined : undefined}
                streetError={errors.latitude?.message}
                onChange={(location) => {
                  applyMapLocation(location);
                  if (!manualLocation) {
                    void syncCatalogFromLocation(location);
                  }
                }}
              />
              {errors.longitude?.message && !errors.latitude?.message && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {errors.longitude.message}
                </p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                {manualLocation
                  ? 'Elige región y comuna; la búsqueda se acotará a esa zona. Escribe calle, número y ciudad en un solo campo.'
                  : 'Busca calle, número y ciudad en un solo campo (ej: Lago Riñihue 155, Concepción). Región y comuna se completan solas.'}
              </p>

              <button
                type="button"
                onClick={() => setManualLocation((prev) => !prev)}
                className="mt-2 text-xs font-medium text-brand-700 hover:underline"
              >
                {manualLocation
                  ? 'Volver a buscar por dirección'
                  : '¿No encuentras tu dirección? Ingresa región y comuna manualmente'}
              </button>

              <div className="mt-4 grid gap-x-6 md:grid-cols-2">
                {manualLocation ? (
                  <>
                    <Field label="Región" required error={errors.region_id?.message}>
                      <Controller
                        name="region_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value != null ? String(field.value) : null}
                            onChange={(v) => {
                              const next = v ? Number(v) : undefined;
                              field.onChange(next);
                              setValue('commune_id', undefined as unknown as number, {
                                shouldDirty: true,
                              });
                              clearErrors(['region_id', 'commune_id']);
                            }}
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
                            onChange={(v) => {
                              const next = v ? Number(v) : undefined;
                              const label = findOptionLabel(communes.options, next);
                              field.onChange(next);
                              clearErrors('commune_id');
                              if (next && label) {
                                void centerMapOnCommune(label, selectedRegionLabel);
                              }
                            }}
                            options={communes.options}
                            loading={communes.isLoading}
                            placeholder={watchedRegionId ? 'Selecciona una comuna' : 'Elige región primero'}
                            disabled={!watchedRegionId}
                          />
                        )}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Región" required error={errors.region_id?.message}>
                      <Input
                        value={selectedRegionLabel}
                        readOnly
                        disabled
                        placeholder="Se completa al confirmar tu dirección"
                        className="cursor-default bg-slate-50 text-slate-700 disabled:opacity-100"
                      />
                    </Field>

                    <Field label="Comuna" required error={errors.commune_id?.message}>
                      <Input
                        value={selectedCommuneLabel}
                        readOnly
                        disabled
                        placeholder="Se completa al confirmar tu dirección"
                        className="cursor-default bg-slate-50 text-slate-700 disabled:opacity-100"
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>

            <Button variant="primary" loading={update.isPending} onClick={handleSubmit(onSubmit)}>
              Guardar cambios
            </Button>
          </div>
        )}
      </Card>

      {store && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Horarios de atención</h3>
          <ScheduleEditor storeId={store.id} />
        </Card>
      )}
        </div>

        {store && (
          <StoreMobilePreview
            data={previewData}
            className="hidden shrink-0 xl:mr-6 xl:block xl:sticky xl:top-6"
          />
        )}
      </div>
    </>
  );
}
