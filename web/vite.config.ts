import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,
      },
      manifest: {
        name: 'Battleship ZK',
        short_name: 'Battleship',
        description: 'Naval warfare with zero-knowledge proofs',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0a1628',
        background_color: '#0a1628',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@noir-lang/noir_js', '@noir-lang/backend_barretenberg'],
  },
});
