import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['microverse-web-development.up.railway.app']
  }
});
