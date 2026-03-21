import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools' // TODO: re-enable when compatible with Node v25
import { sentryVitePlugin } from '@sentry/vite-plugin'
import prerender from '@prerenderer/rollup-plugin'
import PuppeteerRenderer from '@prerenderer/renderer-puppeteer'

const publicRoutes = ['/', '/plans', '/contact', '/privacy-policy', '/terms', '/join']

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    // vueDevTools(), // TODO: re-enable when compatible with Node v25
    // Upload source maps to Sentry on production builds
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only upload source maps in production builds
      disable: process.env.NODE_ENV !== 'production',
      sourcemaps: {
        assets: './dist/**',
      },
    }),
    // Pre-render public pages for SEO - generates static HTML with content
    prerender({
      routes: publicRoutes,
      renderer: new PuppeteerRenderer({
        renderAfterTime: 3000,
        headless: true,
      }),
      postProcess(renderedRoute) {
        // Add data attribute so Vue can hydrate
        renderedRoute.html = renderedRoute.html.replace(
          'id="app"',
          'id="app" data-server-rendered="true"'
        )
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    open: true,
    allowedHosts: [
      'localhost',
      'baofrontend.socialchef.ai',
      'svenfrontend.socialchef.ai',
      'alifrontend.socialchef.ai',
      '.socialchef.ai'
    ],
    proxy: {
      '/api/contact': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable source maps for Sentry
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-i18n': ['vue-i18n'],
          'vendor-date': ['date-fns', 'date-fns-tz'],
          'vendor-gsap': ['gsap'],
        },
      },
    },
  },
})
