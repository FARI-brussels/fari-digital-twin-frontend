import type {
  VehicleFeature,
  GTFSVehicleData,
  VehicleCoordinates,
  VehicleStyle
} from '@/types/vehicle';

/**
 * Utility functions for vehicle data transformation
 * Single Responsibility: Only handles data extraction and transformation
 */

type VehicleData = VehicleFeature | GTFSVehicleData | any;

/**
 * Extract vehicle ID from various data formats
 * @param {VehicleData} vehicle - Vehicle data object
 * @returns {string|null} Vehicle ID
 */
export function getVehicleId(vehicle: VehicleData): string | null {
  if (vehicle.id) return vehicle.id;
  if (vehicle.vehicle?.vehicle?.id) return vehicle.vehicle.vehicle.id;
  if (vehicle.vehicle_id) return vehicle.vehicle_id;
  return null;
}

/**
 * Extract coordinates from GeoJSON Feature or other formats
 * @param {VehicleData} vehicle - Vehicle data object
 * @returns {VehicleCoordinates|null} Coordinates object with latitude, longitude, routeId, tripId
 */
export function extractCoordinates(vehicle: VehicleData): VehicleCoordinates | null {
  let latitude: number | undefined;
  let longitude: number | undefined;
  let routeId: string | undefined;
  let tripId: string | undefined;

  // GeoJSON Feature format (STIB API format)
  if (vehicle.type === 'Feature' && vehicle.geometry?.coordinates) {
    const [lon, lat] = vehicle.geometry.coordinates;
    longitude = lon;
    latitude = lat;
    routeId = vehicle.properties?.route_id || vehicle.properties?.routeId;
    tripId = vehicle.properties?.trip_id || vehicle.properties?.tripId;
  }
  // GTFS Realtime format
  else if (vehicle.vehicle?.position) {
    latitude = vehicle.vehicle.position.latitude;
    longitude = vehicle.vehicle.position.longitude;
    routeId = vehicle.vehicle.trip?.route_id;
    tripId = vehicle.vehicle.trip?.trip_id;
  }
  // Simple format
  else if (vehicle.latitude && vehicle.longitude) {
    latitude = vehicle.latitude;
    longitude = vehicle.longitude;
    routeId = vehicle.route_id;
    tripId = vehicle.trip_id;
  }

  if (!latitude || !longitude) return null;

  return { latitude, longitude, routeId, tripId };
}

/**
 * Interpolate between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number} Interpolated value
 */
export function interpolate(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get vehicle styling (color, type)
 * Open/Closed Principle: Easy to extend with new vehicle types
 * @returns {VehicleStyle} Style object with color and type
 */
export function getVehicleStyle(): VehicleStyle {
  return { color: [0, 120, 255], type: 'Vehicle' };
}
