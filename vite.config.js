import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium';
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium(), tailwindcss()],
  define: {
    //'process.env.API_URL': JSON.stringify('http://0.0.0.0:8080')
    'process.env.API_URL': JSON.stringify('http://57.128.78.8:8080')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  }
})
