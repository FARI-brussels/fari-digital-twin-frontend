import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { getToken } from '@josempgon/vue-keycloak';
import type { Asset, MapLayer, Tileset } from '@/types';

/**
 * Axios instance configured with base URL and auth interceptor
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add auth token interceptor
apiClient.interceptors.request.use(
  async config => {
    try {
      // Only add Keycloak token if Authorization header is not already set
      if (!config.headers.Authorization) {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore token retrieval errors - allow unauthenticated calls to proceed
    }
    return config;
  },
  error => Promise.reject(error)
);

// ============================================================================
// Generic API Functions
// ============================================================================

/**
 * Fetch items from an API endpoint
 */
export function fetchItems<T = unknown>(fetchUrl: string): Promise<AxiosResponse<T[]>> {
  return apiClient.get<T[]>(fetchUrl);
}

/**
 * Upload a file with FormData
 */
export function uploadItem<T = unknown>(
  uploadUrl: string,
  formData: FormData
): Promise<AxiosResponse<T>> {
  return apiClient.post<T>(uploadUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Post JSON data to an endpoint
 */
export function postItem<T = unknown, D = unknown>(
  postUrl: string,
  data: D
): Promise<AxiosResponse<T>> {
  return apiClient.post<T>(postUrl, data);
}

/**
 * Delete an item by URL parameter
 */
export function deleteItem(
  deleteUrlBase: string,
  item: { url: string }
): Promise<AxiosResponse<void>> {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(item.url)}`;
  return apiClient.delete(url);
}

// ============================================================================
// Typed API Functions for Specific Resources
// ============================================================================

/**
 * Fetch assets from the assets manager
 */
export function fetchAssets(): Promise<AxiosResponse<Asset[]>> {
  return apiClient.get<Asset[]>('/assets-manager');
}

/**
 * Upload an asset
 */
export function uploadAsset(formData: FormData): Promise<AxiosResponse<Asset>> {
  return uploadItem<Asset>('/assets-manager/upload', formData);
}

/**
 * Delete an asset
 */
export function deleteAsset(asset: { url: string }): Promise<AxiosResponse<void>> {
  return deleteItem('/assets-manager/delete', asset);
}

/**
 * Fetch map layers
 */
export function fetchMapLayers(): Promise<AxiosResponse<MapLayer[]>> {
  return apiClient.get<MapLayer[]>('/maps-manager/all');
}

/**
 * Add a map layer
 */
export function addMapLayer(layer: {
  url: string;
  layer: string;
  description: string;
}): Promise<AxiosResponse<MapLayer>> {
  return apiClient.post<MapLayer>('/maps-manager/add_layer', layer);
}

/**
 * Delete a map layer
 */
export function deleteMapLayer(
  deleteUrlBase: string,
  layer: { url: string; layer: string }
): Promise<AxiosResponse<void>> {
  const url = `${deleteUrlBase}?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(layer.layer)}`;
  return apiClient.delete(url);
}

/**
 * Fetch tilesets
 */
export function fetchTilesets(): Promise<AxiosResponse<Tileset[]>> {
  return apiClient.get<Tileset[]>('/tileset-manager');
}

/**
 * Upload a tileset
 */
export function uploadTileset(formData: FormData): Promise<AxiosResponse<Tileset>> {
  return uploadItem<Tileset>('/tileset-manager/upload', formData);
}

/**
 * Delete a tileset
 */
export function deleteTileset(tileset: { url: string }): Promise<AxiosResponse<void>> {
  return deleteItem('/tileset-manager/delete', tileset);
}

/**
 * Fetch vehicle positions (realtime data)
 USELESS NO ?
export function fetchVehiclePositions(
  endpoint: string,
  customHeaders?: Record<string, string>
): Promise<AxiosResponse<VehicleGeoJSONCollection | VehicleFeature[]>> {
  return apiClient.get(endpoint, { headers: customHeaders });
}
  */
 
/**
 * Mobility Twin API Endpoints Configuration
 * * The resason to use mobility twin here is because the harvester that compute the vehicule position 
  * from the different stib endpoint is not there in the ts backend 
  * We could implement in the ts backend , to be discussed
 */
export const MobilityEndpoints = {
  stib: '/stib/vehicle-position',
  sncb: '/sncb/vehicle-position',
  bolt: '/bolt/vehicle-position',
  dott: '/dott/vehicle-position',
  telraam: '/traffic/telraam',
  tunnels: '/traffic/tunnels',
  tunnelDevices: '/traffic/tunnel-devices',
  airQuality: '/environment/air-quality',
} as const;

export type MobilitySource = keyof typeof MobilityEndpoints;

/**
 * Fetch vehicle positions from Mobility Twin API
 * The resason to use mobility twin here is because the harvester that compute the vehicule position 
 * from the different stib endpoint is not there in the ts backend 
 * We could implement in the ts backend , to be discussed
 */
export const mobilityTwinApiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.mobilitytwin.brussels',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_MOBILITY_TWIN_API_TOKEN}`,
  },
});

/**
 * Generic function to fetch data from Mobility Twin API
 */
export function fetchMobilityData<T = unknown>(
  source: MobilitySource,
  params?: Record<string, string | number | boolean>
): Promise<AxiosResponse<T>> {
  const endpoint = MobilityEndpoints[source];
  return mobilityTwinApiClient.get<T>(endpoint, { params });
}

