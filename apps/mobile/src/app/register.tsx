/**
 * Pantalla de registro (visual). Sirve para cliente y, con `?role=courier`, para
 * repartidor (ajusta el título). La conexión real con `POST /api/auth/register-courier`
 * + sesión segura es Fase 2: por ahora el envío muestra un aviso.
 */
import { useState } from 'react';
import { View, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { BrandMark } from '@/ui/BrandMark';
import { colors, fonts } from '@/ui/theme';

export default function Register() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const isCourier = role === 'courier';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    // TODO(Fase 2): registerService/registerCourierService → token → router.replace('/(public)').
    Alert.alert('Próximamente', 'El registro estará disponible en la siguiente fase.');
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

          <View className="mt-2">
            <Button label={isCourier ? 'Crear cuenta de repartidor' : 'Crear cuenta'} onPress={onSubmit} />
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
