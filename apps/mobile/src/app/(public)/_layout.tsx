import { Tabs } from 'expo-router';
import { Compass, Map as MapIcon, User, Bike, ClipboardList } from 'lucide-react-native';
import { colors, fonts } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';
import { AnimatedTabIcon } from '@/components/AnimatedTabIcon';

// Navegación principal del cliente: 3 pestañas. Activo en navy de marca,
// inactivo en muted. Fondo blanco con borde superior fino (look limpio y plano).
export default function PublicLayout() {
  // Sin sesión, la pestaña Cuenta muestra un aviso "!" para invitar a entrar.
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const showAccountBadge = status === 'anonymous';
  const isCourier = !!user?.roles.includes('delivery');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[700],
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Compass} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={MapIcon} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="vacancies"
        options={{
          title: 'Ofertas',
          href: isCourier ? '/vacancies' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Bike} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Postulaciones',
          href: isCourier ? '/applications' : null,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={ClipboardList} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={User} color={color} size={size} focused={focused} />
          ),
          tabBarBadge: showAccountBadge ? '!' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.amber,
            color: colors.white,
            fontSize: 10,
            fontFamily: fonts.bold,
          },
        }}
      />
      {/* Detalle de tienda: navegable desde las tarjetas, oculto de la TabBar. */}
      <Tabs.Screen name="store/[id]" options={{ href: null }} />
      <Tabs.Screen name="courier-onboarding" options={{ href: null }} />
      <Tabs.Screen name="courier-reviews" options={{ href: null, title: 'Mis Reseñas' }} />
    </Tabs>
  );
}
