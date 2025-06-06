import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/intranet/',
  server: {
    port: 3003,
    proxy: {
      '/intranet/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/intranet/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 600, // Increase warning limit slightly
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-v${Date.now()}.[ext]`,
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            // React and related core libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('@headlessui')) {
              return 'ui-vendor';
            }
            // Date/time libraries
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Form libraries
            if (id.includes('react-hook-form')) {
              return 'form-vendor';
            }
            // All other vendor libraries
            return 'vendor';
          }
          // Split page components into their own chunks
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1].split('/')[0];
            return `page-${pageName}`;
          }
        }
      }
    }
  }
})