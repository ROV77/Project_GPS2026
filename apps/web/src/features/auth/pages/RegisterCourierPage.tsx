import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerCourierSchema,
  type RegisterCourierInput,
} from '@caserita/validations';
import { User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Button, Field, Input, PasswordInput } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';

export function RegisterCourierPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCourierInput>({
    resolver: zodResolver(registerCourierSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: RegisterCourierInput) => {
    try {
      const { token, user } = await authApi.registerCourier(values);
      setSession(token, user);
      toast.success('¡Listo! Bienvenido, repartidor');
      navigate('/delivery', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo crear la cuenta'));
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-center text-2xl font-bold text-slate-900">
        Únete como repartidor
      </h2>
      <p className="mt-1 text-center text-slate-500">
        Crea tu cuenta y empieza a recibir oportunidades de reparto.
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
                placeholder="Juan Pérez"
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
                placeholder="juan@correo.cl"
                className="h-12 text-base"
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
          Crear cuenta de repartidor
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        ¿Tienes un negocio?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Regístralo aquí
        </Link>
      </p>
    </AuthLayout>
  );
}
