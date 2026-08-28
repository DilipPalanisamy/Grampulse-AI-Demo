import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base path so assets load on GitHub Pages subpaths and Render without 404s
  base: './',
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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
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
