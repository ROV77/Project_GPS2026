/**
 * Pestaña Cuenta. Tres estados según la sesión (features/auth/session.store):
 *  - cargando: spinner breve mientras se hidrata el perfil.
 *  - anónimo: CTA para iniciar sesión + tarjeta "¿Quieres ser repartidor?".
 *  - autenticado: avatar editable arriba a la derecha + perfil + cerrar sesión.
 *    La tarjeta de repartidor suma el rol `delivery` a la cuenta existente.
 *
 * Las TIENDAS no se crean aquí: el mobile es solo cliente/repartidor. Una tarjeta
 * deriva al web (caseritapp.cl) para crear/configurar un negocio.
 */
import { useState } from 'react';
import { View, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, User, Phone, Store as StoreIcon } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Avatar } from '@/ui/Avatar';
import { colors } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';
import { becomeCourier } from '@/features/auth/api';
import { pickAndUploadAvatar } from '@/features/auth/avatar';
import { getApiErrorMessage } from '@/shared/api/errors';

const WEB_URL = 'https://caseritapp.cl';

const ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  seller: 'Vendedor',
  delivery: 'Repartidor',
  admin: 'Administrador',
};

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "septiembre 2025" sin depender de Intl (limitado en Hermes). */
function memberSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AccountScreen() {
  const router = useRouter();
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const setSession = useSession((s) => s.setSession);
  const logout = useSession((s) => s.logout);
  const [becoming, setBecoming] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const isAuth = status === 'authenticated' && !!user;
  const isCourier = !!user?.roles.includes('delivery');

  const onChangeAvatar = async () => {
    setAvatarLoading(true);
    try {
      await pickAndUploadAvatar();
    } catch (e) {
      Alert.alert(
        'No se pudo actualizar',
        getApiErrorMessage(e, e instanceof Error ? e.message : undefined),
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  const onBecomeCourier = async () => {
    setBecoming(true);
    try {
      const { user: updated, store } = await becomeCourier();
      setSession(updated, store);
    } catch (e) {
      Alert.alert('No se pudo completar', getApiErrorMessage(e));
    } finally {
      setBecoming(false);
    }
  };

  if (status === 'loading') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand[700]} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header: nombre (autenticado) o "Cuenta" (anónimo) + avatar editable
          a la derecha. El avatar ahora es más grande y con borde/sombra. */}
      <View className="flex-row items-center justify-between px-5 pb-5 pt-4">
        <View className="flex-1 pr-3">
          {isAuth ? (
            <>
              <Text variant="title">{user.name ?? 'Usuario'}</Text>
              <Text
                variant="caption"
                className="mt-1"
                style={{ color: colors.mutedForeground }}
              >
                {user.email}
              </Text>
              {user.roles.length > 0 && (
                <Text
                  variant="caption"
                  className="mt-0.5"
                  style={{ color: colors.mutedForeground }}
                >
                  {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ')}
                </Text>
              )}
            </>
          ) : (
            <Text variant="title">Cuenta</Text>
          )}
        </View>
        {isAuth && (
          <Avatar
            uri={user.avatar_url}
            size={72}
            onPress={onChangeAvatar}
            loading={avatarLoading}
          />
        )}
      </View>

      <View className="gap-3 px-5">
        {isAuth ? (
          <Card>
            {memberSince(user.created_at) && (
              <Text variant="caption">
                Miembro desde {memberSince(user.created_at)}
              </Text>
            )}

            {user.phone && (
              <View className="mt-3 flex-row items-center gap-2">
                <Phone size={16} color={colors.mutedForeground} strokeWidth={2} />
                <Text variant="body">{user.phone}</Text>
              </View>
            )}

            <View className="mt-4">
              <Button
                label="Cerrar sesión"
                variant="secondary"
                onPress={() => {
                  void logout();
                }}
              />
            </View>
          </Card>
        ) : (
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <User size={22} color={colors.brand[700]} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text variant="subtitle">Inicia sesión</Text>
                <Text variant="caption" className="mt-0.5">
                  Accede a tu cuenta para ver tu información.
                </Text>
              </View>
            </View>
            <View className="gap-2 pt-4">
              <Button label="Iniciar sesión" onPress={() => router.push('/login')} />
              <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />
            </View>
          </Card>
        )}

        {/* Repartidor: suma el rol delivery (con sesión) o lleva a su registro. */}
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Bike size={22} color={colors.brand[700]} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle">¿Quieres ser repartidor?</Text>
              <Text variant="caption" className="mt-0.5">
                {isCourier
                  ? 'Ya tienes el rol de repartidor en tu cuenta.'
                  : 'Postula a las tiendas y reparte en tu zona.'}
              </Text>
            </View>
          </View>
          {!isCourier && (
            <View className="pt-4">
              <Button
                label="Soy repartidor"
                loading={becoming}
                onPress={
                  isAuth ? onBecomeCourier : () => router.push('/register?role=courier')
                }
              />
            </View>
          )}
        </Card>

        {/* Las tiendas son del web: derivar a caseritapp.cl. */}
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <StoreIcon size={22} color={colors.brand[700]} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle">¿Tienes un negocio?</Text>
              <Text variant="caption" className="mt-0.5">
                Crea y administra tu tienda desde el sitio web.
              </Text>
            </View>
          </View>
          <View className="pt-4">
            <Button
              label="Créalo en caseritapp.cl"
              variant="secondary"
              onPress={() => {
                void Linking.openURL(WEB_URL);
              }}
            />
          </View>
        </Card>

        {!isAuth && (
          <Text variant="caption" className="px-1">
            Explorar tiendas y catálogos no requiere cuenta.
          </Text>
        )}
      </View>
    </Screen>
  );
}
