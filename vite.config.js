import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Under `vercel dev`, APIs are served on the same origin — proxying /api back
    // to :3000 causes loops. When running `vite` alone, forward /api to Vercel.
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
