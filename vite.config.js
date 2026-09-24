import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

const resolvePath = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig(({ command }) => {
  return {
    base: command === 'build' ? './' : '/',
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
