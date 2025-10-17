import type { AxiosInstance } from 'axios';
import { apiClient } from '@/lib/api';
import type { VehicleFeature, VehicleGeoJSONCollection } from '@/types/vehicle';

/**
 * Service responsible for fetching vehicle positions from the API
 * Single Responsibility: Only handles API communication
 */
export class VehicleService {
  private apiClient: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  /**
   * Fetch current vehicle positions
   * @returns {Promise<VehicleFeature[]>} Array of vehicle features in GeoJSON format
   */
  async fetchVehiclePositions(): Promise<VehicleFeature[]> {
    const headers: Record<string, string> = {};
    const twinToken = import.meta.env.VITE_TWIN_API_TOKEN;

    if (twinToken) {
      headers.Authorization = `Bearer ${twinToken}`;
    }

    const response = await this.apiClient.get<VehicleGeoJSONCollection | VehicleFeature[]>(
      '/stib/vehicle-position',
      { headers }
    );

    let vehicleData: VehicleFeature[] = [];

    if (Array.isArray(response.data)) {
      // Direct array of features
      vehicleData = response.data;
    } else if (response.data && 'features' in response.data) {
      // GeoJSON FeatureCollection
      vehicleData = response.data.features || [];
    }

    return vehicleData;
  }
}

// Default instance for convenience
export const vehicleService = new VehicleService(apiClient);
