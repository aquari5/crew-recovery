/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' so the build works from any static host (GitHub Pages subpath, file server).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.ts'],
    // macOS writes '._*' sidecar files on exFAT/FAT drives; they are not tests.
    exclude: ['**/._*', '**/node_modules/**'],
  },
})
