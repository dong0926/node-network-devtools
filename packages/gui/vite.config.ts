import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 输出到主包的 dist/gui 目录
    outDir: resolve(__dirname, '../../dist/gui'),
    emptyOutDir: true,
    // 生成单个 HTML 文件，便于内嵌
    rollupOptions: {
      output: {
        // 使用固定的文件名，便于服务器引用
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: false
  }
})
