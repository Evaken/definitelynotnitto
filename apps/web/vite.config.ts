import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves the site from a subdirectory named after the repository,
 * so a production build has to know that prefix or every asset it references
 * 404s. The dev server has no such prefix, hence the split: hard-coding the
 * repo path for both would leave `npm run dev` serving from a path that does
 * not exist locally.
 */
const REPO_PATH = '/definitelynotnitto/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? REPO_PATH : '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
}));
