import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const backendPort = process.env.QUIZ_BACKEND_PORT || process.env.PORT || 3002;
const backendUrl = process.env.QUIZ_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

// Navy is the welcome screen's colour, so the splash and the app's first frame match.
const NAVY = '#00123c';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' keeps a new version waiting until src/pwa.js swaps it in on the
      // welcome screen; 'autoUpdate' would reload the kiosk mid-quiz.
      registerType: 'prompt',
      injectRegister: false,
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // The icons are already precached by globPatterns below.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'The 60-Second Talent Challenge',
        short_name: 'Talent Challenge',
        description: 'Indeed FutureWorks quiz kiosk.',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        theme_color: NAVY,
        background_color: NAVY,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Routing and update handling live in src/sw.js.
      injectManifest: {
        // Everything the kiosk needs to run with the Wi-Fi down. Only woff2 fonts:
        // every browser that can install a PWA reads woff2, so the woff copies would be dead weight.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': backendUrl,
    },
  },
});
