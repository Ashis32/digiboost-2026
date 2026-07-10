import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  return {
    base: command === 'build' && !isVercel ? '/digiboost-2026/' : '/',
    server: {
      port: 5173,
      host: true
    }
  };
});
