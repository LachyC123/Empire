import { defineConfig } from 'vite';

// Relative base so the build works from a subdirectory on any static host.
export default defineConfig({
  base: './',
  server: { port: 5173, fs: { allow: ['.'] } },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } }
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' }
});
