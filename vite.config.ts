import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import inject from '@rollup/plugin-inject'
// import mix from 'vite-plugin-mix'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 3003,
  },
  base: '/',
  optimizeDeps: {
    include: ['bn.js'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'ton-core': ['ton-core'],
          sandbox: ['@ton-community/sandbox'],
        },
      },
      plugins: [inject({ Buffer: ['Buffer', 'Buffer'] })],
    },
    modulePreload: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src'),
      util: 'src/util.ts',
      fs: 'src/fs.ts',
    },
  },
  define: {
    ...(command === 'build'
      ? {}
      : {
          process: {},
        }),
  },
}))
