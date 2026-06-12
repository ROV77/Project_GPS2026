import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/api/errors';
import { applyApiValidationErrors } from '@/shared/lib/form';
import { Button, Card, Field, Input, Skeleton } from '@/shared/ui';
import { useMyAccount, useUpdateUser } from '../hooks/useUser';

// El correo no se edita aquí (es la identidad de la cuenta). Solo nombre y teléfono.
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
        onSuccess: () => toast.success('Cuenta actualizada'),
        onError: (error) => {
          if (applyApiValidationErrors(error, setError)) return;
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return (
    <>
      <PageHeader title="Mi cuenta" subtitle="Datos del titular del comercio" />
      <Card className="max-w-xl">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        ) : (
          <div>
            <Field label="Correo electrónico">
              <Input value={user?.email ?? ''} disabled />
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
            <Field label="Teléfono" error={errors.phone?.message}>
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
              Guardar
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
