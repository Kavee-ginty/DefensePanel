import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Under `vercel dev`, APIs are on the same origin; proxying /api to :3000 loops.
    // With plain `vite`, forward /api to Vercel on 3000 when both are running.
    ...(process.env.VERCEL
      ? {}
      : {
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
            },
          },
        }),
  },
});
