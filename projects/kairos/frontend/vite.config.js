import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/sw.js'
      },
      output: {
        manualChunks: {},
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 8192
  },
  publicDir: 'public'
})