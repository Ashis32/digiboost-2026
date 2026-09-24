import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

const resolvePath = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig(({ command }) => {
  const isGhPages = process.env.GITHUB_PAGES === '1' || process.env.GITHUB_PAGES === 'true';
  return {
    base: isGhPages ? '/digiboost-2026/' : '/',
    server: {
      port: 5173,
      host: true
    },
    build: {
      rollupOptions: {
        input: {
          main: resolvePath('index.html'),
          crownQuest: resolvePath('digiboost-crown-quest/index.html')
        }
      }
    }
  };
});
