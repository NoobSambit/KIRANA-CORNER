import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.entries(env).forEach(([key, value]) => {
    if (process.env[key] === undefined) process.env[key] = value;
  });

  return {
  plugins: [react(), localRecipeAssistantApi()],
  base: './',
  optimizeDeps: {
    include: ['lucide-react'],
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
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
};
});

function localRecipeAssistantApi(): Plugin {
  return {
    name: 'local-recipe-assistant-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/recipe-cart-suggestions', async (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { success: false, error: 'Method not allowed' });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const mod = await server.ssrLoadModule('/api/_lib/recipeAssistant.ts');
          const input = mod.validateRecipeAssistantRequest(body);
          const suggestions = await mod.buildRecipeCartSuggestions(input);
          sendJson(res, 200, { success: true, ...suggestions });
        } catch (error) {
          const statusCode =
            typeof error === 'object' &&
            error !== null &&
            'statusCode' in error &&
            typeof error.statusCode === 'number'
              ? error.statusCode
              : 500;
          const message = error instanceof Error ? error.message : 'Recipe assistant failed.';
          console.error('Local recipe assistant API error:', message);
          sendJson(res, statusCode, { success: false, error: message });
        }
      });
    },
  };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 4_000) {
        reject(new Error('Request is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON request body.'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}
