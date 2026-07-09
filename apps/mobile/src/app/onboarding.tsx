/**
 * Onboarding paso a paso (3 pantallas) que explica qué hace la app. Carrusel
 * horizontal con indicadores (dots) y botón Siguiente / Empezar. Al terminar
 * (o "Saltar") lleva a la pantalla de acceso.
 */
import { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, Bike, type LucideIcon } from 'lucide-react-native';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Logo } from '@/ui/Logo';
import { useThemeColors } from '@/ui/theme';
import { markOnboardingSeen } from '@/shared/lib/onboarding';

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Store,
    title: 'Descubre tu barrio',
    body: 'Encuentra los comercios locales cercanos a ti, reunidos en un solo lugar.',
  },
  {
    icon: ShoppingBag,
    title: 'Explora sus catálogos',
    body: 'Mira productos, precios y fotos de cada tienda antes de visitarla.',
  },
  {
    icon: Bike,
    title: '¿Eres repartidor?',
    body: 'Postúlate a las tiendas y reparte pedidos en tu zona cuando quieras.',
  },
];

export default function Onboarding() {
  const colors = useThemeColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  // Marcar como visto (tanto al terminar como al "Saltar") para no repetir el
  // onboarding en próximas aperturas. Entra directo a explorar (sin login). La
  // navegación no espera al guardado.
  const finish = () => {
    void markOnboardingSeen();
    router.replace('/(public)');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <Screen edges={{ top: true, bottom: true }}>
      {/* Logo + Saltar */}
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Logo variant="plain" height={22} />
        <Pressable onPress={finish} hitSlop={8}>
          <Text variant="label">Saltar</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {SLIDES.map((slide) => {
          const Icon = slide.icon;
          return (
            <View
              key={slide.title}
              style={{ width }}
              className="flex-1 items-center justify-center px-10"
            >
              <View className="mb-8 h-28 w-28 items-center justify-center rounded-full bg-brand-50">
                <Icon size={48} color={colors.brand[700]} strokeWidth={1.75} />
              </View>
              <Text variant="title" className="mb-3 text-center">
                {slide.title}
              </Text>
              <Text variant="body" className="text-center" style={{ color: colors.mutedForeground }}>
                {slide.body}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Indicadores */}
      <View className="flex-row justify-center gap-2 pb-6">
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            className={`h-2 rounded-full ${i === index ? 'w-6 bg-brand-700' : 'w-2 bg-border'}`}
          />
        ))}
      </View>

      <View className="px-5 pb-2">
        <Button label={isLast ? 'Empezar' : 'Siguiente'} onPress={next} />
      </View>
    </Screen>
  );
}
