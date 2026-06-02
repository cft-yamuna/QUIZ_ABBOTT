import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.QUIZ_BACKEND_PORT || process.env.PORT || 3002;
const backendUrl = process.env.QUIZ_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': backendUrl,
    },
  },
});
