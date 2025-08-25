import axios, { type AxiosError } from 'axios'

if (!import.meta.env.VITE_BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not set. Check your .env files.')
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message = (error.response?.data as any)?.message || error.message || 'Request failed'
    const normalized = new Error(message)
    normalized.name = 'ApiError'
    // @ts-expect-error preserve original error for debugging
    normalized.cause = error
    throw normalized
  }
)
