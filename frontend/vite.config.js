import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-custom.js',
      manifestFilename: 'manifest.webmanifest',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,json}'],
        cleanupOutdatedCaches: true,
        sourcemap: true
      },
      manifest: {
        name: 'Campus Unified',
        short_name: 'Campus App',
        description: 'Campus management application with push notifications',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
        ],
      }
    })
  ],
  server: {
    hmr: {
      overlay: true, // Show errors as overlay
    },
    watch: {
      usePolling: true, // Enable polling for changes in Windows
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // No rewrite necessary, maintain the /api prefix
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // Additional optimizations for development
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Ensure no caching of assets
  build: {
    // Add timestamp to asset filenames to prevent browser caching
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
      },
    },
  },
})