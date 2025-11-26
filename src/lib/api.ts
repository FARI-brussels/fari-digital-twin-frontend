import axios, { type AxiosInstance } from 'axios';
import { getToken } from '@josempgon/vue-keycloak';

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Only add Keycloak token if Authorization header is not already set
      if (!config.headers?.Authorization) {
        const token = await getToken();
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      // Ignore token retrieval errors so unauthenticated calls can still proceed when needed.
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const fetchItems = (fetchUrl: string) => {
  return apiClient.get(fetchUrl);
};

export const uploadItem = (uploadUrl: string, formData: FormData) => {
  return apiClient.post(uploadUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const postItem = (postUrl: string, data: any) => {
  return apiClient.post(postUrl, data);
};

export const deleteItem = (deleteUrlBase: string, item: { url: string }) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(item.url)}`;
  return apiClient.delete(url);
};

export const deleteMapLayer = (deleteUrlBase: string, layer: { url: string; layer: string }) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(layer.layer)}`;
  return apiClient.delete(url);
};
