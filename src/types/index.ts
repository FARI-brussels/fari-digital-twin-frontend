/**
 * Central type definitions for the Digital Twin Frontend
 */

import type { Component } from 'vue';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// ============================================================================
// Backend Resource Record (shared structure for assets, tilesets, etc.)
// ============================================================================

export interface ResourceRecord {
  id: number;
  name: string;
  type: string;
  url: string;
  date: string;
  description: string;
  source: string;
  owner_id: number | null;
  filename: string;
  is_public: boolean;
}

// ============================================================================
// Asset Types
// ============================================================================

export interface Asset {
  id?: number;
  url: string;
  name: string;
  description?: string;
  type?: string;
  date?: string;
  owner_id?: number;
  is_public?: boolean;
}

// ============================================================================
// Map Layer Types
// ============================================================================

export interface MapLayer {
  url: string;
  layer: string;
  description: string;
  id?: number;
}

export interface GroupedLayers {
  [provider: string]: MapLayer[];
}

// ============================================================================
// Tileset Types
// ============================================================================

export interface Tileset {
  id?: number;
  url: string;
  name?: string;
  description?: string;
  date?: string;
}

// ============================================================================
// Dataset Types (Realtime)
// ============================================================================

export interface RealtimeDataset {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  type: string;
  url?: string; // Optional for compatibility with LibraryItem
}

// ============================================================================
// Vehicle Types (GeoJSON)
// ============================================================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number] | [number, number, number];
}

export interface VehicleProperties {
  id?: number;
  pointId?: number;
  vehicleId?: string;
  route_id?: string;
  routeId?: string;
  routeShortName?: string;
  trip_id?: string;
  tripId?: string;
  [key: string]: unknown;
}

export interface VehicleFeature {
  id?: string;
  type: 'Feature';
  properties: VehicleProperties;
  geometry: GeoJSONPoint;
}

export interface VehicleGeoJSONCollection {
  type: 'FeatureCollection';
  features: VehicleFeature[];
}

export interface VehicleData {
  id: string;
  longitude: number;
  latitude: number;
  routeId?: string;
  color: [number, number, number];
}

// ============================================================================
// Demo/Example Types
// ============================================================================

export type LayerType = 'basemap' | 'tileset' | 'wms';

export interface ExampleLayer {
  id: string;
  name: string;
  type: LayerType;
  url?: string;
  layer?: string;
  enabled: boolean;
  style?: unknown;
}

export interface DemoExample {
  id: string;
  name: string;
  description: string;
  layers: ExampleLayer[];
}

// ============================================================================
// LibraryBase Component Types
// ============================================================================

export type ItemType = 'asset' | 'map' | 'tileset' | 'dataset';
export type CodeLanguage = 'js' | 'unity' | 'react';

export type CodeSnippetGenerator<T> = (item: T) => string;

export interface CodeSnippets<T> {
  js?: CodeSnippetGenerator<T>;
  unity?: CodeSnippetGenerator<T>;
  react?: CodeSnippetGenerator<T>;
}

export interface LibraryItem {
  url?: string;
  id?: string | number;
  name?: string;
  description?: string;
  layer?: string;
}

export interface LibraryBaseProps<T extends LibraryItem = LibraryItem> {
  title: string;
  itemType: ItemType;
  fetchUrl?: string;
  deleteUrlBase?: string;
  viewerComponent: Component;
  uploadComponent?: Component;
  codeSnippets: CodeSnippets<T>;
  transformData?: (data: unknown[]) => T[];
  deleteItem?: (item: T) => Promise<void>;
  staticItems?: T[];
  customFetch?: () => Promise<ApiResponse<T[]>>;
}

// ============================================================================
// Keycloak Types
// ============================================================================

export interface KeycloakTokenParsed {
  name?: string;
  preferred_username?: string;
  email?: string;
  sub?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

export interface KeycloakInstance {
  token?: string;
  tokenParsed?: KeycloakTokenParsed;
  authenticated?: boolean;
  login: (options?: { redirectUri?: string }) => Promise<void>;
  logout: (options?: { redirectUri?: string }) => Promise<void>;
  register: (options?: { redirectUri?: string }) => Promise<void>;
  updateToken: (minValidity: number) => Promise<boolean>;
}

// ============================================================================
// Cesium Types (Minimal declarations for type safety)
// ============================================================================

export interface CesiumViewerOptions {
  timeline?: boolean;
  animation?: boolean;
  baseLayerPicker?: boolean;
  geocoder?: boolean;
  homeButton?: boolean;
  sceneModePicker?: boolean;
  navigationHelpButton?: boolean;
  infoBox?: boolean;
  selectionIndicator?: boolean;
  fullscreenButton?: boolean;
  terrainProvider?: unknown;
  imageryProvider?: unknown;
  terrain?: unknown;
  sceneMode?: unknown;
}

// ============================================================================
// Environment Variables
// ============================================================================

export interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  readonly VITE_KEYCLOAK_REDIRECT_PATH?: string;
  readonly VITE_KEYCLOAK_LOGOUT_REDIRECT_PATH?: string;
  readonly VITE_KEYCLOAK_SILENT_CHECK_PATH?: string;
  readonly VITE_TWIN_API_TOKEN?: string;
  readonly VITE_CESIUM_ION_TOKEN?: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
