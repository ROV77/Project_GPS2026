/**
 * Tokens de marca en JS (para props que NO aceptan className: colores de íconos
 * lucide, tintColor de la TabBar, placeholders, etc.). Espejo de la paleta de
 * tailwind.config.js y de apps/web/src/index.css (fuente de verdad).
 */
export const colors = {
  brand: {
    50: '#eff4fb',
    100: '#dbe6f4',
    400: '#6286c2',
    500: '#3f66a8',
    700: '#1e3a5f',
    800: '#1a3050',
    900: '#0f1d2e',
  },
  background: '#f8fafc',
  foreground: '#0f172a',
  card: '#ffffff',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  destructive: '#dc2626',
  amber: '#f59e0b',
  white: '#ffffff',
} as const;

/** Familias de Inter cargadas en el root layout (ver app/_layout.tsx). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
