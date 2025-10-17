/**
 * Vehicle-related TypeScript types and interfaces
 */

// GeoJSON types
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface VehicleProperties {
  id?: number;
  pointId?: number;
  route_id?: string;
  routeId?: string;
  trip_id?: string;
  tripId?: string;
  [key: string]: any;
}

export interface VehicleFeature {
  id: string;
  type: 'Feature';
  properties: VehicleProperties;
  geometry: GeoJSONPoint;
}

export interface VehicleGeoJSONCollection {
  type: 'FeatureCollection';
  features: VehicleFeature[];
}

// GTFS Realtime format (alternative format)
export interface GTFSVehiclePosition {
  latitude: number;
  longitude: number;
}

export interface GTFSTrip {
  route_id?: string;
  trip_id?: string;
}

export interface GTFSVehicle {
  vehicle: {
    id: string;
  };
  position: GTFSVehiclePosition;
  trip?: GTFSTrip;
}

export interface GTFSVehicleData {
  vehicle: GTFSVehicle;
}

// Extracted coordinates
export interface VehicleCoordinates {
  latitude: number;
  longitude: number;
  routeId?: string;
  tripId?: string;
}

// Interpolated vehicle for rendering
export interface InterpolatedVehicle {
  id: string;
  longitude: number;
  latitude: number;
  routeId?: string;
  tripId?: string;
  color: [number, number, number];
  type: string;
}

// Vehicle style
export interface VehicleStyle {
  color: [number, number, number];
  type: string;
}
