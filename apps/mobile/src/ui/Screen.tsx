/**
 * Contenedor base de pantalla: respeta los safe areas (notch / barra inferior)
 * y aplica el fondo de la app. Toda pantalla se envuelve en <Screen>.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({
  children,
  edges = { top: true, bottom: false },
}: {
  children: ReactNode;
  edges?: { top?: boolean; bottom?: boolean };
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-transparent"
      style={{
        paddingTop: edges.top ? insets.top : 0,
        paddingBottom: edges.bottom ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );
}
