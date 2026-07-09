import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@caserita/validations';
import { User, Mail, Store, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button, Field, Input, PasswordInput, Textarea } from '@/shared/ui';
import { Select } from '@/shared/ui/Select';
import { useCatalogOptions } from '@/shared/hooks/useCatalogOptions';
import { useCommunesByRegion } from '@/shared/hooks/useCommunesByRegion';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useAuthStore, homePathForRoles } from '../stores/authStore';
import { authApi } from '../api/authApi';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const categories = useCatalogOptions('categories');
  const regions = useCatalogOptions('regions');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', storeName: '' },
  });

  // Comuna en cascada: depende de la región elegida.
  const regionId = watch('region_id');
  const communes = useCommunesByRegion(regionId != null ? String(regionId) : null);

  const onSubmit = async (values: RegisterInput) => {
    try {
      const { token, user } = await authApi.register(values);
      setSession(token, user);
      toast.success('¡Cuenta creada! Bienvenido a CaseritApp');
      navigate(homePathForRoles(user.roles), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo crear la cuenta'));
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-center text-2xl font-bold text-slate-900">
        Registra tu negocio
      </h2>
      <p className="mt-1 text-center text-slate-500">
        Crea tu cuenta y empieza a vender con nosotros.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        <Field label="Tu nombre" required error={errors.name?.message} className="mb-5">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                invalid={!!errors.name}
                prefix={<User className="size-5" />}
                placeholder="Rosa Pérez"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Field
          label="Nombre del negocio"
          required
          error={errors.storeName?.message}
          className="mb-5"
        >
          <Controller
            name="storeName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                invalid={!!errors.storeName}
                prefix={<Store className="size-5" />}
                placeholder="Verdulería Doña Rosa"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Field
          label="Correo electrónico"
          required
          error={errors.email?.message}
          className="mb-5"
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                invalid={!!errors.email}
                prefix={<Mail className="size-5" />}
                placeholder="contacto@donarosa.cl"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Field
          label="Categoría"
          required
          error={errors.category_id?.message}
          className="mb-5"
        >
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value != null ? String(field.value) : ''}
                onChange={field.onChange}
                options={categories.options}
                placeholder="Selecciona una categoría"
                invalid={!!errors.category_id}
              />
            )}
          />
        </Field>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <Field label="Región" required error={errors.region_id?.message}>
            <Controller
              name="region_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value != null ? String(field.value) : ''}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('commune_id', undefined as never); // reset comuna
                  }}
                  options={regions.options}
                  placeholder="Región"
                  invalid={!!errors.region_id}
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
                  value={field.value != null ? String(field.value) : ''}
                  onChange={field.onChange}
                  options={communes.options}
                  placeholder={regionId ? 'Comuna' : 'Elige región'}
                  disabled={!regionId || communes.isLoading}
                  loading={communes.isLoading}
                  invalid={!!errors.commune_id}
                />
              )}
            />
          </Field>
        </div>

        <Field
          label="Teléfono"
          error={errors.store_phone?.message}
          className="mb-5"
        >
          <Controller
            name="store_phone"
            control={control}
            render={({ field }) => (
              <Input
                value={field.value ?? ''}
                onChange={field.onChange}
                prefix={<Phone className="size-5" />}
                placeholder="+56 9 1234 5678"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Field
          label="Descripción"
          error={errors.description?.message}
          className="mb-5"
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                value={field.value ?? ''}
                onChange={field.onChange}
                rows={2}
                placeholder="Cuéntale a tus clientes qué ofreces"
              />
            )}
          />
        </Field>

        <Field
          label="Contraseña"
          required
          error={errors.password?.message}
          className="mb-5"
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                {...field}
                invalid={!!errors.password}
                placeholder="••••••••"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          className="h-12 w-full text-base"
          loading={isSubmitting}
        >
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
