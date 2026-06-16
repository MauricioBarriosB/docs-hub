import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Vendor chunk map: first matching entry wins. Expressed as the function form
// Rollup's current types require (the object-map form was removed from typings).
const VENDOR_CHUNKS: Record<string, readonly string[]> = {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'motion-vendor': ['framer-motion'],
};

function manualChunks(id: string): string | undefined {
  for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
    if (packages.some((pkg) => id.includes(`node_modules/${pkg}/`))) {
      return chunk;
    }
  }
  return undefined;
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Sub-path base only for the production build (GitHub Pages); '/' for the dev server.
  base: command === 'build' ? '/docs-hub/' : '/',
  plugins: [react(), tailwindcss()],
  // Pin the dev server to 5173 so its origin always matches the backend CORS
  // allow-list. strictPort makes Vite fail loudly if 5173 is taken instead of
  // silently drifting to 5174 (whose origin the API would reject → NetworkError).
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
