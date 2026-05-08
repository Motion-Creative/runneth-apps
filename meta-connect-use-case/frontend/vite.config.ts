import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/meta-connect/',
  build: {
    outDir: 'dist',
  },
});
