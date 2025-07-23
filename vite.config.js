import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const isProduction = process.env.NODE_ENV === 'production'
const basePath = isProduction ? '/word-up/' : '/'

export default defineConfig({
  base: basePath,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      injectRegister: 'script',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Word Up - Daily Word Puzzle',
        short_name: 'Word Up',
        description: 'A British English daily word puzzle game. Guess the 5-letter word in 6 tries!',
        theme_color: '#2d3748',
        background_color: '#1a202c',
        display: 'standalone',
        orientation: 'portrait',
        scope: '.',
        start_url: '.',
        lang: 'en-GB',
        categories: ['games', 'entertainment', 'education'],
        prefer_related_applications: false,
        icons: [
          {
            src: './icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: './icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: './icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: false // Disable PWA in development to avoid sw.js errors
      }
    })
  ]
})