/**
 * Pantalla de acceso (antes de las funciones principales). Ofrece iniciar sesión,
 * crear cuenta o entrar como repartidor. El acceso "como invitado" NO es explícito:
 * es la **X arriba a la izquierda**, que salta directo a explorar (zona pública).
 */
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Bike } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { BrandMark } from '@/ui/BrandMark';
import { colors, fonts } from '@/ui/theme';

export default function Welcome() {
  const router = useRouter();
  const enterAsGuest = () => router.replace('/(public)');

  return (
    <Screen edges={{ top: true, bottom: true }}>
      {/* Invitado = X arriba a la izquierda (no explícito) */}
      <View className="px-3 pt-1">
        <Pressable
          onPress={enterAsGuest}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full"
          accessibilityLabel="Entrar como invitado"
        >
          <X size={26} color={colors.foreground} />
        </Pressable>
      </View>

      <View className="flex-1 justify-center px-6">
        {/* Marca */}
        <View className="mb-10 items-center">
          <BrandMark size={64} />
          <Text className="mt-4 text-center" style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.foreground }}>
            Bienvenido a Caserita
          </Text>
          <Text variant="body" className="mt-1 text-center" style={{ color: colors.mutedForeground }}>
            Los comercios de tu barrio, en tu bolsillo.
          </Text>
        </View>

        {/* Acciones */}
        <View className="gap-3">
          <Button label="Iniciar sesión" onPress={() => router.push('/login')} />
          <Button label="Crear cuenta" variant="secondary" onPress={() => router.push('/register')} />

          <Pressable
            onPress={() => router.push('/register?role=courier')}
            className="mt-1 h-12 flex-row items-center justify-center gap-2 rounded-lg bg-brand-50"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Bike size={18} color={colors.brand[700]} strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semibold, color: colors.brand[700] }}>
              Quiero ser repartidor
            </Text>
          </Pressable>
        </View>
      </View>

      <Text variant="caption" className="px-8 pb-4 text-center">
        Explorar tiendas y catálogos no requiere cuenta.
      </Text>
    </Screen>
  );
}
