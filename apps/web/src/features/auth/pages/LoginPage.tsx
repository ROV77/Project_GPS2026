import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Alert, Button, Checkbox, Field, Input, PasswordInput } from '@/shared/ui';
import { useAuthStore } from '../stores/authStore';

// Esquema local: no hay schema de login compartido en @caserita/validations
// porque la API aún no tiene /auth. Reproduce el patrón RHF + zod del resto del panel.
const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
});
type LoginInput = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@caserita.cl', password: '', remember: true },
  });

  const onSubmit = (values: LoginInput) => {
    // Autenticación SIMULADA: cualquier credencial válida entra (ver authStore).
    login(values.email);
    toast.success('Sesión iniciada');
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-slate-800">Inicia sesión</h2>
      <p className="text-sm text-slate-500">Ingresa al panel de tu comercio.</p>

      <Alert
        className="mt-4"
        type="info"
        title="Demo: autenticación simulada"
        description="Usa cualquier correo y una contraseña de 6+ caracteres."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
        <Field label="Correo electrónico" required error={errors.email?.message}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                invalid={!!errors.email}
                prefix={<User className="size-4" />}
                placeholder="contacto@donarosa.cl"
              />
            )}
          />
        </Field>

        <Field label="Contraseña" required error={errors.password?.message}>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput {...field} invalid={!!errors.password} placeholder="••••••••" />
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

        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
