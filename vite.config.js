import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: (() => {
      const target = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
      return {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target,
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      };
    })(),
  },
});
