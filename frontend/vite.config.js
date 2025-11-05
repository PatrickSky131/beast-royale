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
      // HMR host 配置说明：
      // 1. 不设置 host：自动使用 server.host（当前为 true，支持所有域名）
      // 2. 设置具体域名：如 'w.xusenqi.site'（仅支持该域名）
      // 3. 使用环境变量：process.env.VITE_HMR_HOST 或自动检测
      // 当前配置：不设置 host，让所有 allowedHosts 中的域名都能连接
      // host: process.env.VITE_HMR_HOST || undefined,  // 可通过环境变量配置
      overlay: false  // 减少重连频率，避免移动端问题
    } : false,
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://localhost:7000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
}))
