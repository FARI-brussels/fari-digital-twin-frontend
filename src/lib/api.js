import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchItems = (fetchUrl) => {
  return apiClient.get(fetchUrl);
};

export const uploadItem = (uploadUrl, formData) => {
  return apiClient.post(uploadUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const postItem = (postUrl, data) => {
  return apiClient.post(postUrl, data);
};

export const deleteItem = (deleteUrlBase, item) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(item.url)}`;
  return apiClient.delete(url);
};

export const deleteMapLayer = (deleteUrlBase, layer) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(layer.layer)}`;
  return apiClient.delete(url);
}; 