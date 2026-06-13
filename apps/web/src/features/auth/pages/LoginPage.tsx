import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Alert, Button, Checkbox, Field, Input, PasswordInput } from '@/shared/ui';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';

// El backend valida con `loginSchema` (@caserita/validations); aquí extendemos
// con `remember` (solo de UI) manteniendo las mismas reglas de email/password.
const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
});
type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@caserita.cl', password: '', remember: true },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const { token, user } = await authApi.login({
        email: values.email,
        password: values.password,
      });
      setSession(token, user);
      toast.success('Sesión iniciada');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo iniciar sesión'));
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-center text-2xl font-bold text-slate-900">Inicia sesión</h2>
      <p className="mt-1 text-center text-slate-500">Ingresa al panel de tu comercio.</p>

      <Alert
        className="mt-5"
        type="info"
        title="Cuenta de demostración"
        description="Usa demo@caserita.cl con la contraseña demo123 (datos del seed)."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
        <Field label="Correo electrónico" required error={errors.email?.message} className="mb-5">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                invalid={!!errors.email}
                prefix={<User className="size-5" />}
                placeholder="contacto@donarosa.cl"
                className="h-12 text-base"
              />
            )}
          />
        </Field>

        <Field label="Contraseña" required error={errors.password?.message} className="mb-5">
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

        <Field>
          <Controller
            name="remember"
            control={control}
            render={({ field }) => (
              <Checkbox checked={field.value} onChange={field.onChange}>
                Recordarme
              </Checkbox>
            )}
          />
        </Field>

        <Button
          type="submit"
          variant="primary"
          className="h-12 w-full text-base"
          loading={isSubmitting}
        >
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
