import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupConfig from './build/rollup.config';

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.ktlinks.cn', // 后端服务地址
        changeOrigin: true,
        secure: false,
        ws: true,
        // 如果后端 API 路径不包含 /api 前缀，可以重写路径
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  css: {
    // 开启 CSS Source Map，方便在浏览器中定位样式来源
    devSourcemap: true,
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  // 开发环境启用 Source Map
  define: {
    __DEV__: JSON.stringify(true)
  },
  build: {
    // 生成构建产物的 Source Map，便于排查线上问题
    sourcemap: true,
    // 构建时的 CSS 配置
    cssCodeSplit: true,
    // 确保 CSS 只输出到 dist 目录
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 🔥 禁用自定义 manualChunks，使用 Vite 默认策略
        // 这是避免循环依赖的唯一可靠方法
        chunkFileNames: 'chunks/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: rollupConfig.assetFileNames,
      }
    },

    // 分包大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 启用 gzip 压缩分析
    reportCompressedSize: true,
  }
}));
