/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  build: {
    rollupOptions: {
      output: {
        /** 短语 wav 单独进 dist/assets/audio/，避免与其它静态资源混在同一层 */
        assetFileNames(assetInfo) {
          const stem = assetInfo.names?.[0] ?? assetInfo.name ?? ''
          if (stem.endsWith('.wav')) {
            return 'assets/audio/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@game-config': resolve(__dirname, '../server/src/config/game.client-shim.ts'),
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
