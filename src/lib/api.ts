import axios, { type AxiosError } from 'axios'

if (!import.meta.env.VITE_BACKEND_URL) {
  console.error('VITE_BACKEND_URL is not set. Check your .env files.')
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

export const fetchItems = (fetchUrl: string) => apiClient.get(fetchUrl)

export const uploadItem = (uploadUrl: string, formData: FormData) =>
  apiClient.post(uploadUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const postItem = <TBody extends object>(postUrl: string, data: TBody) =>
  apiClient.post(postUrl, data)

export const deleteItem = (deleteUrlBase: string, item: { url: string }) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(item.url)}`
  return apiClient.delete(url)
}

export const deleteMapLayer = (deleteUrlBase: string, layer: { url: string; layer: string }) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(
    layer.layer
  )}`
  return apiClient.delete(url)
}
