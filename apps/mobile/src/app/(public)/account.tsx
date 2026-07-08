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
import { View, ActivityIndicator, Alert, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, User, Phone, Store as StoreIcon, Star, ChevronRight } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Avatar } from '@/ui/Avatar';
import { BrandGradient } from '@/ui/BrandGradient';
import { colors } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';
import { pickAndUploadAvatar } from '@/features/auth/avatar';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useCourierRatings } from '@/features/delivery/hooks';

// URL del panel web de tiendas (servidor de la U). Deriva acá el botón
// "Créalo en caseritapp.cl" para que las cuentas de tienda NO se gestionen
// desde el mobile (ver también login.tsx: bloquea el rol `seller`).
const WEB_URL = 'https://146.83.194.168:8448/login';

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
  const logout = useSession((s) => s.logout);
  const quitCourier = useSession((s) => s.quitCourier);
  const [quitting, setQuitting] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const isAuth = status === 'authenticated' && !!user;
  const isCourier = !!user?.roles.includes('delivery');

  const { average, loading: ratingsLoading } = useCourierRatings(isCourier ? user?.id : undefined);

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

  const onQuitCourier = () => {
    Alert.alert(
      '¿Dejar de ser repartidor?',
      'Se te quitarán los accesos exclusivos y dejarás de recibir ofertas. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, dejar de ser', 
          style: 'destructive',
          onPress: async () => {
            setQuitting(true);
            try {
              if (quitCourier) await quitCourier();
            } catch (e) {
              Alert.alert('Error', getApiErrorMessage(e));
            } finally {
              setQuitting(false);
            }
          }
        }
      ]
    );
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
      {/* Banner de perfil con gradiente de marca: nombre (autenticado) o "Cuenta"
          (anónimo) + avatar editable a la derecha. */}
      <BrandGradient
        style={{ borderRadius: 20, marginHorizontal: 16, marginBottom: 12, padding: 18 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            {isAuth ? (
              <>
                <Text variant="title" style={{ color: colors.white }}>{user.name ?? 'Usuario'}</Text>
                <Text variant="caption" className="mt-1" style={{ color: '#c7d6ef' }}>
                  {user.email}
                </Text>
                {user.roles.length > 0 && (
                  <Text variant="caption" className="mt-0.5" style={{ color: '#bcd0f0' }}>
                    {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ')}
                  </Text>
                )}
              </>
            ) : (
              <Text variant="title" style={{ color: colors.white }}>Cuenta</Text>
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
      </BrandGradient>

      <View className="gap-3 px-5">
        {isAuth ? (
          <Card elevated>
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
          <Card elevated>
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
        <Card elevated>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Bike size={22} color={colors.brand[700]} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle">
                {isCourier ? 'Perfil de Repartidor' : '¿Quieres ser repartidor?'}
              </Text>
              <Text variant="caption" className="mt-0.5">
                {isCourier
                  ? 'Gestiona tus ofertas desde la pestaña dedicada.'
                  : 'Postula a las tiendas y reparte en tu zona.'}
              </Text>
            </View>
          </View>
          {isCourier ? (
            <View className="pt-4 flex-col gap-4 border-t border-gray-100 mt-4">
              <View className="flex-row items-center justify-between">
                <Text variant="body" className="font-medium text-gray-700">Mi Calificación</Text>
                <TouchableOpacity 
                  className="flex-row items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg active:bg-brand-100 transition-colors"
                  onPress={() => router.push('/courier-reviews')}
                >
                  <Star size={20} color={colors.amber} fill={average > 0 ? colors.amber : 'transparent'} />
                  <Text variant="subtitle">
                    {ratingsLoading ? '...' : (average > 0 ? average.toFixed(1) : 'S/N')}
                  </Text>
                  <ChevronRight size={16} color={colors.brand[700]} />
                </TouchableOpacity>
              </View>
              <Button 
                label="Ya no quiero ser repartidor" 
                variant="secondary" 
                onPress={onQuitCourier}
                loading={quitting}
              />
            </View>
          ) : (
            <View className="pt-4">
              <Button
                label="Soy repartidor"
                onPress={() => router.push('/courier-onboarding')}
              />
            </View>
          )}
        </Card>

        {/* Las tiendas son del web: derivar a caseritapp.cl. */}
        <Card elevated>
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
