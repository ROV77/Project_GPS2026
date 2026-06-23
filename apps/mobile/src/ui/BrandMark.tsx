/**
 * Símbolo de marca de Caserita: el isotipo oficial (tienda + estrella + carrito
 * sobre cuadro navy), reutilizado del panel web. Con `glow` añade un resplandor
 * azul para el splash. Reemplaza el placeholder anterior ("C").
 */
import { View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from './theme';

// Isotipo navy (mismo asset que apps/web/src/assets/icons/logo-caseritapp_navy.png).
const LOGO = require('../../assets/images/logo-caserita.png');

export function BrandMark({ size = 72, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        // Glow radial (visible sobre todo en iOS): resplandor azul de marca.
        ...(glow
          ? {
              shadowColor: colors.brand[400],
              shadowOpacity: 0.95,
              shadowRadius: size * 0.5,
              shadowOffset: { width: 0, height: 0 },
              elevation: 24,
            }
          : {}),
      }}
    >
      <Image
        source={LOGO}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        contentFit="contain"
      />
    </View>
  );
}
