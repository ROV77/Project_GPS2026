import { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Store as StoreIcon } from 'lucide-react';
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
import { MapPicker } from '../components/MapPicker';
import { ScheduleEditor } from '../components/ScheduleEditor';
import { getStoreLocationMetadata } from '../lib/storeMetadata';
import { resolveCommuneId, resolveRegionId } from '../lib/resolveCatalogLocation';
import { toStoreUpdatePayload } from '../lib/toStoreUpdatePayload';
import { geocodeCommune } from '../lib/geocoding';
import type { StoreLocation } from '../types/location';
/** Iniciales (1–2 letras) a partir del nombre; fallback con un icono. */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return '';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function findOptionLabel(
  options: Array<{ value: string; label: string }>,
  id?: number | null,
): string {
  if (id == null) return '';
  return options.find((option) => Number(option.value) === id)?.label ?? '';
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

  const selectedRegionLabel = findOptionLabel(regions.options, watchedRegionId);
  const selectedCommuneLabel = findOptionLabel(communes.options, watchedCommuneId);

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

  // Centra el mapa en la comuna elegida (comuna = fuente de verdad) y resetea
  // la calle para que el usuario afine el punto exacto dentro de esa comuna.
  const centerMapOnCommune = useCallback(
    async (communeLabel: string, regionLabel: string) => {
      const geo = await geocodeCommune(communeLabel, regionLabel);
      if (!geo) return;
      setValue('latitude', geo.lat, { shouldDirty: true, shouldValidate: true });
      setValue('longitude', geo.lng, { shouldDirty: true, shouldValidate: true });
      setValue('address_street', '', { shouldDirty: true });
      setValue('address_number', '', { shouldDirty: true });
      setValue('address', [communeLabel, regionLabel].filter(Boolean).join(', '), {
        shouldDirty: true,
      });
      clearErrors(['latitude', 'longitude', 'address_street']);
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

  // Reverse híbrido NO destructivo: solo actualiza Región/Comuna si el punto cae
  // en una comuna que SÍ existe en el catálogo; si no, respeta la selección.
  const syncCatalogFromLocation = useCallback(
    async (location: StoreLocation) => {
      if (!location.communeName) return;

      const regionId = resolveRegionId(location.regionName, regions.options);
      if (!regionId) return;

      const regionCommunes = await api
        .get<Array<{ id: Id; name: string }>>(`/regions/${regionId}/communes`)
        .then((response) => response.data);

      const communeOptions = regionCommunes.map((commune) => ({
        value: String(commune.id),
        label: commune.name,
      }));

      const communeId = resolveCommuneId(location.communeName, communeOptions);
      if (!communeId) return;

      setValue('region_id', regionId, { shouldDirty: true, shouldValidate: true });
      setValue('commune_id', communeId, { shouldDirty: true, shouldValidate: true });
      clearErrors(['region_id', 'commune_id']);
    },
    [clearErrors, regions.options, setValue],
  );

  const onSubmit = (values: StoreProfileInput) => {
    if (!store) return;
    update.mutate(
      { id: store.id, data: toStoreUpdatePayload(values) },
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
                      onChange={(v) => {
                        const next = v ? Number(v) : undefined;
                        field.onChange(next);
                        // Al cambiar la región se reinicia la comuna (cascada).
                        setValue('commune_id', undefined as unknown as number, { shouldDirty: true });
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
                        // Comuna = fuente de verdad: centra el mapa en ella.
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

            <div className="my-6">
              <MapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                address={watchedAddress}
                addressStreet={watchedStreet}
                addressNumber={watchedNumber}
                communeName={selectedCommuneLabel}
                regionName={selectedRegionLabel}
                streetError={errors.latitude?.message}
                onChange={(location) => {
                  applyMapLocation(location);
                  void syncCatalogFromLocation(location);
                }}
              />
              {errors.longitude?.message && !errors.latitude?.message && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {errors.longitude.message}
                </p>
              )}
            </div>

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
