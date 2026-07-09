import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Card, Field, Input, Skeleton } from '@/shared/ui';
import { PrioritySupportCard } from '@/features/subscriptions/components/PrioritySupportCard';
import { useMyAccount, useUpdateUser } from '../hooks/useUser';
import { AvatarUploader } from '../components/AvatarUploader';

const accountSchema = z.object({
  name: z.string().optional(),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional(),
});
type AccountInput = z.infer<typeof accountSchema>;

export function MyAccountPage() {
  const { data: user, isLoading } = useMyAccount();
  const update = useUpdateUser();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    if (user) reset({ name: user.name ?? '', phone: user.phone ?? '' });
  }, [user, reset]);

  const onSubmit = (values: AccountInput) => {
    if (!user) return;
    update.mutate(
      { id: user.id, data: values },
      {
        onSuccess: () => toast.success('Perfil actualizado'),
        onError: (error) => {
          if (applyApiValidationErrors(error, setError)) return;
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleRemovePhoto = () => {
    if (!user?.avatar_url) return;
    update.mutate(
      { id: user.id, data: { avatar_url: '' } },
      {
        onSuccess: () => toast.success('Foto de perfil eliminada'),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Mi perfil"
        subtitle="Tu foto y datos personales como vendedor (independientes de la tienda)"
      />

      <Card className="max-w-xl">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
              <AvatarUploader
                userId={user.id}
                value={user.avatar_url ?? undefined}
                name={user.name ?? user.email}
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{user.name ?? 'Sin nombre'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.avatar_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 px-0 text-destructive hover:bg-transparent hover:text-red-700"
                    loading={update.isPending}
                    onClick={handleRemovePhoto}
                  >
                    Quitar foto
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Correo electrónico">
                <Input value={user.email ?? ''} disabled />
              </Field>
              <Field label="Nombre" error={errors.name?.message}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input value={field.value ?? ''} onChange={field.onChange} invalid={!!errors.name} />
                  )}
                />
              </Field>
              <Field label="Teléfono personal" error={errors.phone?.message}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      invalid={!!errors.phone}
                      placeholder="+56 9 ..."
                    />
                  )}
                />
              </Field>
              <Button variant="primary" loading={update.isPending} onClick={handleSubmit(onSubmit)}>
                Guardar cambios
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Ventaja Premium: soporte prioritario (visible solo con ese plan). */}
      <PrioritySupportCard />
    </>
  );
}
