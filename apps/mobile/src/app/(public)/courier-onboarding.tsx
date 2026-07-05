import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Bike, ClipboardList, CheckCircle } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { colors } from '@/ui/theme';
import { useSession } from '@/features/auth/session.store';

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    title: 'Conviértete en Repartidor',
    description: 'Postula a vacantes de diferentes tiendas en tu zona. Trabaja a tu propio ritmo y decide cuándo conectarte.',
    icon: Bike,
  },
  {
    title: 'Gestiona tus Postulaciones',
    description: 'Revisa el estado de tus postulaciones en tiempo real y comunícate directamente con los dueños de los negocios.',
    icon: ClipboardList,
  },
  {
    title: 'Empieza a Repartir',
    description: '¡Estás listo! Recibe confirmaciones, organiza tus rutas y comienza a generar ingresos extra.',
    icon: CheckCircle,
  },
];

export default function CourierOnboardingScreen() {
  const router = useRouter();
  const becomeCourier = useSession((s) => s.becomeCourier);
  const status = useSession((s) => s.status);
  const isAuth = status === 'authenticated';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [shooting, setShooting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shootAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showCelebration) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [showCelebration]);

  const handleEntendido = () => {
    setShooting(true);
    Animated.timing(shootAnim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const renderSerpentines = () => {
    if (!shooting) return null;

    const elements = [];
    // Izquierda
    for (let i = 0; i < 4; i++) {
      const translateY = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height * 0.6, height * 0.2 - i * 40]
      });
      const translateX = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, width * 0.3 + i * 20]
      });
      const opacity = shootAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0]
      });
      const rotate = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${180 + i * 60}deg`]
      });

      elements.push(
        <Animated.Text key={`left-${i}`} style={{
          position: 'absolute',
          left: 0,
          top: 0,
          fontSize: 35,
          transform: [{ translateX }, { translateY }, { rotate }],
          opacity,
        }}>
          {i % 2 === 0 ? '🎊' : '🎉'}
        </Animated.Text>
      );
    }

    // Derecha
    for (let i = 0; i < 4; i++) {
      const translateY = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height * 0.6, height * 0.2 - i * 40]
      });
      const translateX = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [width + 50, width * 0.7 - i * 20]
      });
      const opacity = shootAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0]
      });
      const rotate = shootAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `-${180 + i * 60}deg`]
      });

      elements.push(
        <Animated.Text key={`right-${i}`} style={{
          position: 'absolute',
          left: 0,
          top: 0,
          fontSize: 35,
          transform: [{ translateX }, { translateY }, { rotate }],
          opacity,
        }}>
          {i % 2 === 0 ? '🎉' : '🎊'}
        </Animated.Text>
      );
    }

    return elements;
  };

  const currentStep = ONBOARDING_STEPS[step];
  const Icon = currentStep.icon;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLast && isAuth) {
      handleComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await becomeCourier();
      setShowCelebration(true);
    } catch (e) {
      console.error(e);
      // fallback in case of error
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (showCelebration) {
    return (
      <Screen>
        <View className="flex-1 justify-center items-center px-6 relative">
          {renderSerpentines()}
          <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <Text style={{ fontSize: 80, marginBottom: 10, lineHeight: 100 }}>🎉</Text>
            <View className="flex-row gap-4 mb-6">
              <Text style={{ fontSize: 40, lineHeight: 55 }}>🎊</Text>
              <Text style={{ fontSize: 40, lineHeight: 55 }}>📦</Text>
              <Text style={{ fontSize: 40, lineHeight: 55 }}>🚴</Text>
            </View>
          </Animated.View>
          
          <Text variant="title" className="text-center text-3xl mb-4 text-brand-900 font-bold">
            ¡Bienvenido al Equipo!
          </Text>
          <Text variant="body" className="text-center text-gray-600 mb-10 px-4 text-lg">
            Ya eres oficialmente parte de nuestros repartidores. Empieza a buscar ofertas, conectarte con tiendas y generar ingresos extras.
          </Text>
          
          <View className="w-full">
            <Button 
              label={shooting ? "Despegando..." : "¡Entendido!"} 
              onPress={handleEntendido} 
              disabled={shooting} 
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 px-6 pt-10 pb-6 justify-between">
        
        <View className="flex-1 justify-center items-center">
          <View className="h-32 w-32 rounded-full bg-brand-50 items-center justify-center mb-8">
            <Icon size={64} color={colors.brand[700]} strokeWidth={1.5} />
          </View>
          
          <Text variant="title" className="text-center text-2xl mb-4">
            {currentStep.title}
          </Text>
          
          <Text variant="body" className="text-center text-gray-500 px-4 leading-6">
            {currentStep.description}
          </Text>
        </View>

        <View className="w-full pb-4">
          <View className="flex-row justify-center gap-2 mb-8">
            {ONBOARDING_STEPS.map((_, i) => (
              <View 
                key={i} 
                className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-brand-600' : 'w-2 bg-gray-200'}`} 
              />
            ))}
          </View>

          <View className="gap-3">
            {isLast && !isAuth ? (
              <>
                <Button 
                  label="Crear cuenta de repartidor" 
                  onPress={() => router.push('/register?role=courier')} 
                />
                <Button 
                  label="Ya tengo cuenta" 
                  variant="secondary" 
                  onPress={() => router.push('/login')} 
                />
              </>
            ) : (
              <Button 
                label={isLast ? 'Comenzar ahora' : 'Siguiente'} 
                onPress={handleNext} 
                loading={loading}
              />
            )}
            {!isLast && (
              <Button 
                label="Saltar" 
                variant="secondary" 
                onPress={() => setStep(ONBOARDING_STEPS.length - 1)} 
                disabled={loading}
              />
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}
