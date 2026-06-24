import { Tabs } from 'expo-router';
import { Compass, Map as MapIcon, User } from 'lucide-react-native';
import { colors, fonts } from '@/ui/theme';

// Navegación principal del cliente: 3 pestañas. Activo en navy de marca,
// inactivo en muted. Fondo blanco con borde superior fino (look limpio y plano).
export default function PublicLayout() {
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
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {/* Detalle de tienda: navegable desde las tarjetas, oculto de la TabBar. */}
      <Tabs.Screen name="store/[id]" options={{ href: null }} />
    </Tabs>
  );
}
