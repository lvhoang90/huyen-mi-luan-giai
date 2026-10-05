import { defineConfig } from 'vite';
export default defineConfig({
  envDir: 'deploy', // thư mục không có tệp .env: Vite không bao giờ đọc .env chứa bí mật của máy chủ
  build: { rollupOptions: { input: { main: 'index.html', emotions: 'emotions.html', admin: 'admin.html' } } },
});
