import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium';
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  }
})
