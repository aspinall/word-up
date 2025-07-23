import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/word-up/' : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
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
        scope: '/word-up/',
        start_url: '/word-up/',
        lang: 'en-GB',
        categories: ['games', 'entertainment', 'education'],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: '32x32',
            type: 'image/svg+xml'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-mobile.png',
            sizes: '430x932',
            type: 'image/png',
            platform: 'narrow',
            label: 'Mobile gameplay view'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})