import { defineConfig } from 'vite';
export default defineConfig({
  build: { rollupOptions: { input: { main: 'index.html', emotions: 'emotions.html', admin: 'admin.html' } } },
});
