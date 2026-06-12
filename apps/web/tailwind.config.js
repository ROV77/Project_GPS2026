/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta de marca CaseritApp (navy). El tema vive aquí: usar bg-brand-700
      // (primario), hover bg-brand-800, y bg-brand-900 para el sidebar oscuro.
      colors: {
        brand: {
          50: '#eff4fb',
          100: '#dbe6f4',
          200: '#bccfe9',
          300: '#92aed8',
          400: '#6286c2',
          500: '#3f66a8',
          600: '#2f4f86',
          700: '#1e3a5f',
          800: '#1a3050',
          900: '#0f1d2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
