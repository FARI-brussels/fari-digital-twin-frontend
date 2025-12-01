import type { KyInstance } from 'ky';
import { apiClient } from '@/api';
import type { VehicleFeature, VehicleGeoJSONCollection } from '@/types/vehicle';

/**
 * Service responsible for fetching vehicle positions from the API
 * Single Responsibility: Only handles API communication
 */
export class VehicleService {
  private apiClient: KyInstance;

  constructor(apiClient: KyInstance) {
    this.apiClient = apiClient;
  }

  /**
   * Fetch current vehicle positions
   * @returns {Promise<VehicleFeature[]>} Array of vehicle features in GeoJSON format
   */
  async fetchVehiclePositions(): Promise<VehicleFeature[]> {
    const data = await this.apiClient
      .get('stib/vehicle-position')
      .json<VehicleGeoJSONCollection | VehicleFeature[]>();

    let vehicleData: VehicleFeature[] = [];

    if (Array.isArray(data)) {
      // Direct array of features
      vehicleData = data;
    } else if (data && 'features' in data) {
      // GeoJSON FeatureCollection
      vehicleData = data.features || [];
    }

    return vehicleData;
  }
}

// Default instance for convenience
export const vehicleService = new VehicleService(apiClient);
