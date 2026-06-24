/**
 * Pestaña Cuenta. En la experiencia anónima del cliente, su función principal es
 * el acceso al flujo de repartidor (login/registro), que se construirá en la
 * zona (auth) → (courier). Ver docs/AUTH-WEB-VS-MOBILE.md.
 */
import { View } from 'react-native';
import { Bike } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { colors } from '@/ui/theme';

export default function AccountScreen() {
  return (
    <Screen>
      <View className="px-5 pb-4 pt-4">
        <Text variant="title">Tu cuenta</Text>
      </View>

      <View className="gap-3 px-5">
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Bike size={22} color={colors.brand[700]} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle">¿Quieres ser repartidor?</Text>
              <Text variant="caption" className="mt-0.5">
                Postula a las tiendas y reparte en tu zona.
              </Text>
            </View>
          </View>
          <View className="pt-4">
            <Button
              label="Soy repartidor"
              onPress={() => {
                // Próximo: router.push('/(auth)/login'). Flujo en construcción.
              }}
            />
          </View>
        </Card>

        <Text variant="caption" className="px-1">
          Explorar tiendas y catálogos no requiere cuenta. El inicio de sesión es
          solo para el flujo de repartidor.
        </Text>
      </View>
    </Screen>
  );
}
