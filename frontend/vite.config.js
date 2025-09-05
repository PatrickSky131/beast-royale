import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.184.163',
      '.ngrok-free.app', // 允许所有ngrok域名
      '.xusenqi.site',
    ],
    // 根据环境配置HMR
    hmr: mode === 'development' ? {
      port: 5173,
      host: 'localhost',
      // 减少重连频率，避免移动端问题
      overlay: false
    } : false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
