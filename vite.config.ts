import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/burgundy-wedding/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // This forces Vite to put assets in a specific folder and use relative paths
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});
