import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: [
      '@react-oauth/google',
      'jwt-decode',
      'axios',
      'react',
      'react-dom',
      'leaflet',
      'react-leaflet',
      'react-leaflet-cluster',
      'lucide-react',
      'prop-types',
    ],
  },
});
