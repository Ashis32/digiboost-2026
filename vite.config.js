import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? '/digiboost-2026/' : '/',
    server: {
      port: 5173,
      host: true
    }
  };
});
