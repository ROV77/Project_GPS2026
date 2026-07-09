/**
 * Logo horizontal completo de CaseritApp (isotipo + wordmark), reutilizado del
 * panel web. Dos variantes:
 *  - 'border': con borde blanco → para fondos oscuros (hero navy, tarjeta hero).
 *  - 'plain' : sin borde        → para fondos claros (encabezados, onboarding).
 *
 * Para el isotipo cuadrado suelto (splash / ícono) usar `BrandMark`.
 */
import { Image } from 'expo-image';

const LOGOS = {
  border: require('../../assets/icons/logo_caseritapp3.webp'),
  plain: require('../../assets/icons/logo_caseritapp.webp'),
} as const;

// Relación de aspecto del asset (ancho/alto ≈ 1.36). El logo es más ancho que alto;
// fijamos la altura y dejamos el ancho proporcional.
const ASPECT = 1.36;

export function Logo({
  variant = 'plain',
  height = 30,
}: {
  variant?: 'border' | 'plain';
  height?: number;
}) {
  return (
    <Image
      source={LOGOS[variant]}
      style={{ height, width: height * ASPECT }}
      contentFit="contain"
      accessibilityLabel="CaseritApp"
    />
  );
}
