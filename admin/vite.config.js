import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 必须引入path模块

export default defineConfig({
  plugins: [vue()],
  server: { // 新增server配置
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '');
          console.log('代理路径重写:', path, '→', newPath); // 调试输出
          return newPath;
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 精确指向src目录
      'api': path.resolve(__dirname, './src/api'),
      'views': path.resolve(__dirname, './src/views') // 添加views别名
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/mixins.scss";`
      }
    }
  }
})