import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@echo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@echo/backend': path.resolve(__dirname, '../../packages/backend/src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
});
