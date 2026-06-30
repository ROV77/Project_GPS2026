// El import de los estilos compilados de NativeWind DEBE ir primero.
import '../../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useSession } from '@/features/auth/session.store';

// Mantener el splash hasta que las fuentes Inter estén listas (evita un parpadeo
// con la fuente del sistema). Ver app.json → plugin expo-splash-screen.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Ocultar el splash cuando las fuentes carguen O fallen: si `useFonts` devuelve
  // error y solo reaccionáramos a `fontsLoaded`, el splash nativo quedaría visible
  // para siempre (preventAutoHideAsync sin hideAsync) y la app se vería congelada.
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Rehidratar la sesión al abrir la app: si hay token guardado, carga el perfil
  // (GET /auth/me); si no, deja la sesión en estado anónimo. No bloquea la UI.
  useEffect(() => {
    void useSession.getState().hydrate();
  }, []);

  // Mientras no haya resolución (ni cargadas ni error) mantenemos el splash. Ante
  // error seguimos adelante con la fuente del sistema en vez de bloquear la app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/* Cada grupo de rutas maneja su propio header; aquí solo el contenedor. */}
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
