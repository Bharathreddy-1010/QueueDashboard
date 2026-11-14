import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress normal socket close / ECONNRESET on reloads or disconnects
            if (err.code !== 'ECONNRESET') {
              console.warn('[Vite Proxy Warning]', err.message);
            }
          });
        },
      },
    },
  },
});
