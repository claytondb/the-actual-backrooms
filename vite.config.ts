import { defineConfig } from 'vite';

export default defineConfig({
  base: '/the-actual-backrooms/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
});
