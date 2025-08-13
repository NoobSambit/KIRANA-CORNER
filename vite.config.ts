import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    // Dev convenience: if you run `vercel dev` on port 3000 and `npm run dev` for Vite,
    // proxy API calls to the serverless functions so `/api/*` works in Vite too.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Vercel dev server not running. API calls will fail in development.');
            console.log('Run "vercel dev" in another terminal to enable local API testing.');
          });
        },
      },
    },
  },
});
