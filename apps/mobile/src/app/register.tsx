/**
 * Pantalla de registro. Sin `?role` crea un usuario normal (POST
 * /api/auth/register-customer); con `?role=courier` crea un repartidor
 * (/register-courier). En ambos casos guarda el token e hidrata la sesión.
 */
import { useState } from 'react';
import { View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { BrandMark } from '@/ui/BrandMark';
import { colors, fonts } from '@/ui/theme';
import { registerCustomer, registerCourier } from '@/features/auth/api';
import { useSession } from '@/features/auth/session.store';
import { getApiErrorMessage } from '@/shared/api/errors';

export default function Register() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const isCourier = role === 'courier';
  const signIn = useSession((s) => s.signIn);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const mail = email.trim();
    if (name.trim().length < 2 || !mail.includes('@') || password.length < 6) {
      setError('Completa tu nombre, un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = { name: name.trim(), email: mail, password };
      const { token } = isCourier
        ? await registerCourier(payload)
        : await registerCustomer(payload);
      await signIn(token);
      router.replace('/(public)/account');
    } catch (e) {
      setError(getApiErrorMessage(e, 'No se pudo crear la cuenta.'));
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
            {isCourier ? 'Únete como repartidor' : 'Crea tu cuenta'}
          </Text>
          <Text variant="body" className="mt-1 text-center" style={{ color: colors.mutedForeground }}>
            {isCourier ? 'Reparte en las tiendas de tu zona' : 'Es rápido y gratis'}
          </Text>
        </View>

        <View className="gap-3">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Nombre completo"
            autoCapitalize="words"
            icon={<User size={20} color={colors.mutedForeground} strokeWidth={2} />}
          />
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
            placeholder="Contraseña (mín. 6 caracteres)"
            secureTextEntry
            icon={<Lock size={20} color={colors.mutedForeground} strokeWidth={2} />}
          />

          {error && (
            <Text variant="caption" style={{ color: colors.destructive }}>
              {error}
            </Text>
          )}

          <View className="mt-2">
            <Button
              label={isCourier ? 'Crear cuenta de repartidor' : 'Crear cuenta'}
              onPress={onSubmit}
              loading={loading}
            />
          </View>
        </View>

        <Pressable onPress={() => router.replace('/login')} className="mt-6 flex-row justify-center gap-1">
          <Text variant="caption">¿Ya tienes cuenta?</Text>
          <Text variant="caption" style={{ fontFamily: fonts.semibold, color: colors.brand[700] }}>
            Iniciar sesión
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}
