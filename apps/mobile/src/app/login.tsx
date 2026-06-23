/**
 * Pantalla de inicio de sesión (visual). Sigue el layout de la referencia: marca
 * arriba, campos de correo/contraseña y botón principal. La conexión real con
 * `POST /api/auth/login` + la sesión segura es el siguiente paso (Fase 2): por
 * ahora el envío muestra un aviso.
 */
import { useState } from 'react';
import { View, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { BrandMark } from '@/ui/BrandMark';
import { colors, fonts } from '@/ui/theme';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    // TODO(Fase 2): loginService → guardar token (SecureStore) → router.replace('/(public)').
    Alert.alert('Próximamente', 'El inicio de sesión estará disponible en la siguiente fase.');
  };

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <View className="px-3 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver" className="h-10 w-10 items-center justify-center">
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-8 items-center">
          <BrandMark size={56} />
          <Text className="mt-4 text-center" style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.foreground }}>
            Bienvenido de nuevo
          </Text>
          <Text variant="body" className="mt-1 text-center" style={{ color: colors.mutedForeground }}>
            Inicia sesión para continuar
          </Text>
        </View>

        <View className="gap-3">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon={<Mail size={20} color={colors.mutedForeground} strokeWidth={2} />}
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry
            icon={<Lock size={20} color={colors.mutedForeground} strokeWidth={2} />}
          />

          <View className="mt-2">
            <Button label="Iniciar sesión" onPress={onSubmit} />
          </View>
        </View>

        <Pressable onPress={() => router.replace('/register')} className="mt-6 flex-row justify-center gap-1">
          <Text variant="caption">¿No tienes cuenta?</Text>
          <Text variant="caption" style={{ fontFamily: fonts.semibold, color: colors.brand[700] }}>
            Crear cuenta
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
