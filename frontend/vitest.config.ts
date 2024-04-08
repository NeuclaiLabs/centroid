import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    // @ts-ignore
    deps: {
      inline: ['next-auth']
    }
  },
  test: {
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@/': new URL('../frontend/', import.meta.url).pathname
    }
  }
})
