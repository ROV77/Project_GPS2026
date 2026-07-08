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
import { View, ActivityIndicator, Alert, Linking, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, User, Phone, Store as StoreIcon, Star, ChevronRight, Moon, Calendar, LogOut } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Avatar } from '@/ui/Avatar';
import { BrandGradient } from '@/ui/BrandGradient';
import { useThemeColors } from '@/ui/theme';
import { useThemeStore } from '@/ui/themeStore';
import { useSession } from '@/features/auth/session.store';
import { pickAndUploadAvatar } from '@/features/auth/avatar';
import { getApiErrorMessage } from '@/shared/api/errors';
import { useCourierRatings } from '@/features/delivery/hooks';
import { Skeleton } from '@/ui/Skeleton';

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

function memberSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AccountScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const quitCourier = useSession((s) => s.quitCourier);
  const [quitting, setQuitting] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const { theme, setTheme } = useThemeStore();

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
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <BrandGradient
            style={{ borderRadius: 20, marginHorizontal: 16, marginTop: 8, marginBottom: 24, padding: 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3 gap-2">
                <Skeleton width="60%" height={24} className="bg-white/20" />
                <Skeleton width="80%" height={14} className="bg-white/20" />
                <Skeleton width="40%" height={14} className="bg-white/20" />
              </View>
              <Skeleton width={72} height={72} borderRadius={36} className="bg-white/20" />
            </View>
          </BrandGradient>
          <View className="gap-6 px-4">
            <View className="gap-2">
              <Skeleton width={100} height={14} />
              <View className="bg-card rounded-2xl border border-border p-4 gap-4">
                <View className="flex-row items-center gap-4">
                  <Skeleton width={48} height={48} borderRadius={24} />
                  <View className="flex-1 gap-2">
                    <Skeleton width="50%" height={18} />
                    <Skeleton width="80%" height={12} />
                  </View>
                </View>
                <Skeleton width="100%" height={48} borderRadius={8} />
              </View>
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <BrandGradient
          style={{ borderRadius: 20, marginHorizontal: 16, marginTop: 8, marginBottom: 24, padding: 20 }}
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

        <View className="gap-6 px-4">
          {!isAuth && (
            <View className="bg-card rounded-2xl border border-border p-5 gap-4 shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-500">
                  <User size={24} color={colors.white} />
                </View>
                <View className="flex-1">
                  <Text variant="subtitle" className="text-foreground">Inicia sesión</Text>
                  <Text variant="caption" className="text-muted-foreground mt-0.5">
                    Accede a tu cuenta para ver tu información y postular.
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button label="Iniciar sesión" onPress={() => router.push('/login')} />
                </View>
                <View className="flex-1">
                  <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />
                </View>
              </View>
            </View>
          )}

          {/* Configuración */}
          <View className="gap-2">
            <Text variant="caption" className="px-2 text-muted-foreground uppercase font-bold tracking-wider">Configuración</Text>
            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              <View className="flex-row items-center justify-between p-4 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <Moon size={20} color={colors.foreground} />
                  <Text variant="body" className="text-foreground">Modo oscuro</Text>
                </View>
                <Switch 
                  value={theme === 'dark'}
                  onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
                  trackColor={{ false: colors.border, true: colors.brand[500] }}
                  thumbColor={colors.white}
                />
              </View>
              
              {isAuth && user?.phone && (
                <View className="flex-row items-center p-4 border-b border-border gap-3">
                  <Phone size={20} color={colors.foreground} />
                  <Text variant="body" className="text-foreground flex-1">{user.phone}</Text>
                </View>
              )}

              {isAuth && memberSince(user?.created_at) && (
                <View className="flex-row items-center p-4 gap-3">
                  <Calendar size={20} color={colors.mutedForeground} />
                  <Text variant="body" className="text-muted-foreground flex-1">
                    Miembro desde {memberSince(user.created_at)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Repartidor */}
          <View className="gap-2">
            <Text variant="caption" className="px-2 text-muted-foreground uppercase font-bold tracking-wider">Repartidor</Text>
            <View className="bg-card rounded-2xl border border-border p-4 gap-4">
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 bg-brand-500 rounded-full items-center justify-center">
                  <Bike size={24} color={colors.white} />
                </View>
                <View className="flex-1">
                  <Text variant="subtitle" className="text-foreground">
                    {isCourier ? 'Perfil de Repartidor' : '¿Quieres ser repartidor?'}
                  </Text>
                  <Text variant="caption" className="text-muted-foreground mt-0.5">
                    {isCourier
                      ? 'Gestiona tus ofertas desde la pestaña dedicada.'
                      : 'Postula a las tiendas y reparte en tu zona.'}
                  </Text>
                </View>
              </View>

              {isCourier ? (
                <>
                  <TouchableOpacity 
                    className="flex-row items-center justify-between bg-muted rounded-xl p-4 mt-2 active:opacity-80"
                    onPress={() => router.push('/courier-reviews')}
                  >
                    <View className="flex-row items-center gap-2">
                      <Star size={20} color={colors.amber} fill={average > 0 ? colors.amber : 'transparent'} />
                      <Text variant="body" className="font-medium text-foreground">Mis Reseñas</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text variant="subtitle" className="text-foreground">
                        {ratingsLoading ? '...' : (average > 0 ? average.toFixed(1) : 'S/N')}
                      </Text>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                  <Button 
                    label="Dejar de ser repartidor" 
                    variant="secondary" 
                    onPress={onQuitCourier}
                    loading={quitting}
                  />
                </>
              ) : (
                <Button
                  label="Soy repartidor"
                  onPress={() => router.push('/courier-onboarding')}
                />
              )}
            </View>
          </View>

          {/* Tiendas */}
          <View className="gap-2">
            <Text variant="caption" className="px-2 text-muted-foreground uppercase font-bold tracking-wider">Negocios</Text>
            <View className="bg-card rounded-2xl border border-border p-4 gap-4">
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 bg-brand-500 rounded-full items-center justify-center">
                  <StoreIcon size={24} color={colors.white} />
                </View>
                <View className="flex-1">
                  <Text variant="subtitle" className="text-foreground">¿Tienes un negocio?</Text>
                  <Text variant="caption" className="text-muted-foreground mt-0.5">
                    Crea y administra tu tienda web.
                  </Text>
                </View>
              </View>
              <Button
                label="Ir a caseritapp.cl"
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(WEB_URL);
                }}
              />
            </View>
          </View>

          {/* Cerrar sesión */}
          {isAuth && (
            <TouchableOpacity 
              onPress={logout} 
              className="mt-2 flex-row items-center justify-center gap-2 p-4 active:opacity-70"
            >
              <LogOut size={20} color={colors.destructive} />
              <Text variant="subtitle" className="text-destructive">Cerrar sesión</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}
