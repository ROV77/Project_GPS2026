/** @type {import('tailwindcss').Config} */
// Paleta e identidad replicadas de apps/web/src/index.css (fuente de verdad de
// la marca): escala navy `brand` + neutros slate. Misma marca en web y mobile.
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff4fb',
          100: '#dbe6f4',
          200: '#bccfe9',
          300: '#92aed8',
          400: '#6286c2',
          500: '#3f66a8',
          600: '#2f4f86',
          700: '#1e3a5f', // primario: botones, ítem activo
          800: '#1a3050', // pressed / hover
          900: '#0f1d2e', // superficies oscuras / splash
        },
        // Tokens semánticos (neutros slate), espejo del web.
        background: '#f8fafc',
        foreground: '#0f172a',
        card: '#ffffff',
        muted: '#f1f5f9',
        'muted-foreground': '#64748b',
        border: '#e2e8f0',
        destructive: '#dc2626',
        amber: '#f59e0b', // estrellas de rating
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      borderRadius: {
        lg: '10px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
