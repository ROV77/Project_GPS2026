import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// El front nunca habla con http://localhost:3000 directamente: pega a rutas
// relativas '/api/...' y Vite las redirige al backend en dev (evita CORS y
// hardcodear hosts). En producción, el reverse proxy debe mapear /api al API.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
