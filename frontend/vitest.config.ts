import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {},
  test: {
    environment: 'jsdom',
    exclude: ['tests/*'],
    include: ['__tests__/*'],
    includeSource: ['components/*.{js,ts}']
  },
  resolve: {
    alias: {
      '@/': new URL('../frontend/', import.meta.url).pathname
    }
  }
})
