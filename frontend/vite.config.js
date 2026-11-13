// Vite + PWA. Em desenvolvimento, /api vai para o backend (porta 8081).
// O service worker guarda o app e os pontos de atendimento para abrir sem internet;
// a triagem anônima e o assistente precisam de rede.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg'],
      manifest: {
        name: 'Tem Direito',
        short_name: 'Tem Direito',
        description: 'Descubra a que benefícios sociais sua família provavelmente tem direito, o que levar e aonde ir.',
        lang: 'pt-BR',
        theme_color: '#17704A',
        background_color: '#f6f8f7',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/swagger/],
        runtimeCaching: [
          { urlPattern: /\/api\/(pontos|bairros|assistente\/sugestoes)/, handler: 'StaleWhileRevalidate', options: { cacheName: 'td-api-leitura' } },
          { urlPattern: /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\//, handler: 'CacheFirst', options: { cacheName: 'td-mapa', expiration: { maxEntries: 300 } } }
        ]
      }
    })
  ],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8081' } },
  preview: { proxy: { '/api': 'http://localhost:8081' } },
  test: { environment: 'node' }
});
