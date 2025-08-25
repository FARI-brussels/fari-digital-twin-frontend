import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { VueQueryPlugin, QueryClient, VueQueryPluginOptions } from '@tanstack/vue-query'

if (!import.meta.env.VITE_BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not set. Check your .env files.')
}

const app = createApp(App)
const queryClient = new QueryClient()
app.use(router)
app.use(VueQueryPlugin, { queryClient } as VueQueryPluginOptions)
app.mount('#app')
