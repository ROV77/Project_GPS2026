/**
 * Pantalla de inicio de sesión. Llama a POST /api/auth/login, guarda el token en
 * secure-store e hidrata la sesión (features/auth/session.store), luego lleva a
 * la pestaña Cuenta.
 */
import { useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { BrandMark } from '@/ui/BrandMark';
import { colors, fonts } from '@/ui/theme';
import { login as loginRequest } from '@/features/auth/api';
import { useSession } from '@/features/auth/session.store';
import { getApiErrorMessage } from '@/shared/api/errors';

export default function Login() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const mail = email.trim();
    if (!mail.includes('@') || password.length < 6) {
      setError('Ingresa un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await loginRequest(mail, password);
      // La app mobile es para clientes y repartidores. Las cuentas de tienda
      // (rol `seller`) administran su negocio desde el panel web: no tienen
      // cabida acá, así que se bloquea el acceso antes de guardar el token.
      if (user.roles.includes('seller')) {
        setError(
          'Esta cuenta es para administrar una tienda. Usa el panel web en https://146.83.194.168:8448 para ingresar.',
        );
        return;
      }
      await signIn(token);
      router.replace('/(public)/account');
    } catch (e) {
      setError(getApiErrorMessage(e, 'Credenciales inválidas'));
    } finally {
      setLoading(false);
    }
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

          {error && (
            <Text variant="caption" style={{ color: colors.destructive }}>
              {error}
            </Text>
          )}

          <View className="mt-2">
            <Button label="Iniciar sesión" onPress={onSubmit} loading={loading} />
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
