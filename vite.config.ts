import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  assetsInclude: ['**/*.mp3', '**/*.ogg', '**/*.wav'],
});
