import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchItems = (fetchUrl) => {
  return apiClient.get(fetchUrl);
};

export const deleteItem = (deleteUrlBase, item) => {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(item.url)}`;
  return apiClient.delete(url);
};

export const deleteMapLayer = (layer) => {
  const url = `/maps-manager/delete?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(layer.layer)}`;
  return apiClient.delete(url);
}; 