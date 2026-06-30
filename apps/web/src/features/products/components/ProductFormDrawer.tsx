import { useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createProductSchema, type CreateProductInput } from '@caserita/validations';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, CurrencyInput, Drawer, Field, Input, Switch, Textarea } from '@/shared/ui';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { ProductImageUploader } from './ProductImageUploader';
import { StockSelect } from './StockSelect';
import type { Product } from '../types';

const emptyDefaults: Partial<CreateProductInput> = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  featured: false,
};

/**
 * Formulario de crear/editar producto. Patrón canónico del panel:
 * react-hook-form + zodResolver(createProductSchema) — las MISMAS reglas que
 * valida el backend, importadas de @caserita/validations. Los errores 400 de la
 * API se mapean a cada campo con setError; los demás se muestran como toast.
 *
 * Modelo de una sola tienda: el producto se asigna automáticamente a la tienda
 * de la cuenta (storeId), por eso ya no hay selector de tienda.
 */
export function ProductFormDrawer({
  open,
  product,
  storeId,
  onClose,
}: {
  open: boolean;
  product: Product | null;
  storeId: string | undefined;
  onClose: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEdit = Boolean(product);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateProductInput>({
    // El schema usa .default() en price/stock: el tipo de entrada los hace
    // opcionales y diverge del de salida. Casteamos el resolver al tipo de salida
    // (el que recibe onSubmit) para alinear los genéricos de react-hook-form.
    resolver: zodResolver(createProductSchema) as Resolver<CreateProductInput>,
    defaultValues: emptyDefaults,
  });

  // Al abrir, sincroniza el formulario con la fila editada (o lo limpia en alta).
  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        store_id: Number(product.store_id),
        name: product.name,
        description: product.description ?? '',
        price: Number(product.price),
        stock: product.stock,
        image_url: product.image_url ?? undefined,
        featured: product.featured,
      });
    } else {
      // Alta: el producto pertenece a la tienda de la cuenta (storeId).
      reset({ ...emptyDefaults, store_id: storeId ? Number(storeId) : undefined });
    }
  }, [open, product, storeId, reset]);

  const onSubmit = (values: CreateProductInput) => {
    const handlers = {
      onSuccess: () => {
        toast.success(isEdit ? 'Producto actualizado' : 'Producto creado');
        onClose();
      },
      onError: (error: unknown) => {
        if (applyApiValidationErrors(error, setError)) return;
        toast.error(getApiErrorMessage(error));
      },
    };

    if (product) update.mutate({ id: product.id, data: values }, handlers);
    else create.mutate(values, handlers);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
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
      <Field label="Nombre" required error={errors.name?.message}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} invalid={!!errors.name} placeholder="Empanada de pino" />
          )}
        />
      </Field>

      <Field label="Descripción" error={errors.description?.message}>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              value={field.value ?? ''}
              onChange={field.onChange}
              rows={3}
              placeholder="Opcional"
            />
          )}
        />
      </Field>

      <Field label="Precio (CLP)" error={errors.price?.message}>
        <Controller
          name="price"
          control={control}
          render={({ field }) => (
            <CurrencyInput value={field.value} onChange={field.onChange} invalid={!!errors.price} />
          )}
        />
      </Field>

      <Field label="Stock" error={errors.stock?.message}>
        <Controller
          name="stock"
          control={control}
          render={({ field }) => (
            <StockSelect value={field.value} onChange={field.onChange} invalid={!!errors.stock} />
          )}
        />
      </Field>

      <Field label="Imagen" error={errors.image_url?.message}>
        <Controller
          name="image_url"
          control={control}
          render={({ field }) => (
            <ProductImageUploader value={field.value} onChange={field.onChange} />
          )}
        />
      </Field>

      <Field label="Destacado">
        <Controller
          name="featured"
          control={control}
          render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
        />
      </Field>
    </Drawer>
  );
}
