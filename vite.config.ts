import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'paw.svg'],
      manifest: {
        name: 'Zoomies - Fresh Pet Food',
        short_name: 'Zoomies',
        description: 'Fresh, home-style meals for dogs and cats. Order delivery or takeaway.',
        theme_color: '#fbf6ed',
        background_color: '#fbf6ed',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'paw-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'paw-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Do not cache API endpoints or Supabase calls
        navigateFallbackDenylist: [/^\/api/, /^https:\/\/.*\.supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ]
});
