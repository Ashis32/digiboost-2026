import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  const isGhPages = process.env.GITHUB_PAGES === '1' || process.env.GITHUB_PAGES === 'true';
  return {
    base: isGhPages ? '/digiboost-2026/' : '/',
    server: {
      port: 5173,
      host: true
    }
  };
});
