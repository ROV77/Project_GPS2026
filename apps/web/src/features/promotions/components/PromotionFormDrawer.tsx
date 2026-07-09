import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import {
  PROMOTION_TYPES,
  type CreatePromotionInput,
  type PromotionType,
} from '@caserita/validations';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Drawer, Field, NumberInput, Select, Switch } from '@/shared/ui';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCreatePromotion, useUpdatePromotion } from '../hooks/usePromotions';
import { promotionTypeLabel } from '../lib/promotionDisplay';
import type { Promotion } from '../types';

/** Valores del formulario (el value del Select es string; las fechas, yyyy-mm-dd). */
interface PromotionFormValues {
  product_id: string;
  discount_type: PromotionType;
  discount_value?: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
}

const emptyDefaults: PromotionFormValues = {
  product_id: '',
  discount_type: 'percentage',
  discount_value: undefined,
  is_active: true,
  valid_from: '',
  valid_until: '',
};

const TYPE_OPTIONS = PROMOTION_TYPES.map((t) => ({ value: t, label: promotionTypeLabel(t) }));

const dateInputClass =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground ' +
  'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Formulario de crear/editar promoción. Sigue el patrón de ProductFormDrawer
 * (react-hook-form + Drawer + Field/Controller). No usa zodResolver porque el
 * schema coacciona fechas (string→Date) y complicaría los tipos del form; la
 * validación fuerte la hace el backend y sus errores 400 se mapean por campo.
 */
export function PromotionFormDrawer({
  open,
  promotion,
  onClose,
}: {
  open: boolean;
  promotion: Promotion | null;
  onClose: () => void;
}) {
  const create = useCreatePromotion();
  const update = useUpdatePromotion();
  const isEdit = Boolean(promotion);

  // Productos de la tienda para el selector (una sola tienda por cuenta).
  const { data: productsPage } = useProducts({ page: 1, limit: 100 });
  const productOptions = (productsPage?.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<PromotionFormValues>({ defaultValues: emptyDefaults });

  const type = watch('discount_type');

  // Al abrir, sincroniza con la promoción editada o limpia en alta.
  useEffect(() => {
    if (!open) return;
    if (promotion) {
      reset({
        product_id: String(promotion.product_id),
        discount_type: promotion.discount_type,
        discount_value:
          promotion.discount_value != null ? Number(promotion.discount_value) : undefined,
        is_active: promotion.is_active,
        valid_from: promotion.valid_from?.slice(0, 10) ?? '',
        valid_until: promotion.valid_until?.slice(0, 10) ?? '',
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, promotion, reset]);

  const onSubmit = (values: PromotionFormValues) => {
    const payload: CreatePromotionInput = {
      product_id: Number(values.product_id),
      discount_type: values.discount_type,
      is_active: values.is_active,
      ...(values.discount_type === 'percentage' && values.discount_value != null
        ? { discount_value: values.discount_value }
        : {}),
      ...(values.valid_from ? { valid_from: new Date(values.valid_from) } : {}),
      ...(values.valid_until ? { valid_until: new Date(values.valid_until) } : {}),
    };

    const handlers = {
      onSuccess: () => {
        toast.success(isEdit ? 'Promoción actualizada' : 'Promoción creada');
        onClose();
      },
      onError: (error: unknown) => {
        if (applyApiValidationErrors(error, setError)) return;
        toast.error(getApiErrorMessage(error));
      },
    };

    if (promotion) update.mutate({ id: promotion.id, data: payload }, handlers);
    else create.mutate(payload, handlers);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar promoción' : 'Nueva promoción'}
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
      <Field label="Producto" required error={errors.product_id?.message}>
        <Controller
          name="product_id"
          control={control}
          rules={{ required: 'Selecciona un producto' }}
          render={({ field }) => (
            <Select
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? '')}
              options={productOptions}
              placeholder="Selecciona un producto"
              invalid={!!errors.product_id}
            />
          )}
        />
      </Field>

      <Field label="Tipo de promoción" required error={errors.discount_type?.message}>
        <Controller
          name="discount_type"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={(v) => field.onChange((v as PromotionType) ?? 'percentage')}
              options={TYPE_OPTIONS}
              placeholder="Tipo"
            />
          )}
        />
      </Field>

      {type === 'percentage' && (
        <Field label="Descuento (%)" required error={errors.discount_value?.message}>
          <Controller
            name="discount_value"
            control={control}
            rules={{
              required: 'Ingresa el porcentaje',
              min: { value: 1, message: 'Mínimo 1%' },
              max: { value: 100, message: 'Máximo 100%' },
            }}
            render={({ field }) => (
              <NumberInput
                value={field.value}
                onChange={field.onChange}
                min={1}
                placeholder="20"
                invalid={!!errors.discount_value}
              />
            )}
          />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Inicio (opcional)" error={errors.valid_from?.message}>
          <Controller
            name="valid_from"
            control={control}
            render={({ field }) => (
              <input type="date" className={dateInputClass} value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
        </Field>
        <Field label="Término (opcional)" error={errors.valid_until?.message}>
          <Controller
            name="valid_until"
            control={control}
            render={({ field }) => (
              <input type="date" className={dateInputClass} value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
        </Field>
      </div>

      <Field label="Activa">
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
        />
      </Field>
    </Drawer>
  );
}
