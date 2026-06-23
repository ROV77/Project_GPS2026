/**
 * Splash de marca. Tras el splash nativo (color sólido), el logo entra con un
 * **slide-up + fade-in** (sube desde abajo mientras aparece) para dar sensación
 * de movimiento, permanece un momento y luego navega al onboarding.
 */
import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandMark } from '@/ui/BrandMark';
import { colors } from '@/ui/theme';
import { hasSeenOnboarding } from '@/shared/lib/onboarding';

// Tiempo mínimo que el logo permanece visible antes de continuar.
const SPLASH_MS = 1700;

export default function Splash() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current; // arranca 28px más abajo

  useEffect(() => {
    // Slide-up + fade-in (~750 ms, easing suave de salida).
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Decidir el destino en paralelo a la animación: si el onboarding ya se vio,
    // saltarlo y entrar directo al acceso. Garantizamos el mínimo de splash.
    let cancelled = false;
    (async () => {
      const seen = await hasSeenOnboarding();
      await new Promise((resolve) => setTimeout(resolve, SPLASH_MS));
      if (!cancelled) router.replace(seen ? '/welcome' : '/onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, [opacity, translateY, router]);

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.brand[900] }}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <BrandMark size={92} glow />
      </Animated.View>
    </View>
  );
}
