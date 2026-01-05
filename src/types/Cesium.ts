import type { Ref, ShallowRef } from 'vue';
import { Viewer, ImageryLayer, Entity, Cesium3DTileset } from 'cesium';

export const DEFAULT_VIEW_STATE: CesiumViewState = {
  longitude: 4.3517,
  latitude: 50.8503,
  altitude: 1000,
  pitch: -32,
  bearing: 0,
} as const;

export type CesiumViewerRef = ShallowRef<Viewer | null>

export interface ModelOptions {
  scale?: number;
  rotation?: [number, number, number];
  minimumPixelSize?: number;
  maximumScale?: number;
}

export interface TilesetOptions {
  maximumScreenSpaceError?: number;
  skipLevelOfDetail?: boolean;
}

export interface WMSOptions {
  opacity?: number;
  brightness?: number;
  contrast?: number;
  maximumLevel?: number,
  tileWidth?: number,
  tileHeight?: number,
  parameters?: Record<string, string | number | boolean>
}

export interface GeoJsonOptions {
  clampToGround?: boolean;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}



export interface CesiumViewState {
  longitude: number;
  latitude: number;
  altitude?: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export interface CesiumViewerOptions {
  container: Ref<HTMLElement | null>;
  initialViewState?: Partial<CesiumViewState>;
  enableOSMBuildings?: boolean;
  enableTerrain?: boolean;
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

export interface CesiumViewer {
  viewer: Ref<Viewer | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  ready: Ref<boolean>;
  add3DModel: (url: string, position: [number, number, number], options?: ModelOptions) => Promise<Entity>;
  addTileset: (url: string, options?: TilesetOptions) => Promise<Cesium3DTileset>;
  addWMSLayer: (url: string, layers: string, options?: WMSOptions) => void;
  removeWMSLayer: (layer: ImageryLayer) => void;
  clearWMSCache: () => void;
  clearModelCache: () => void;
  addGeoJsonLayer: (data: any, options?: GeoJsonOptions) => void;
  setViewState: (state: Partial<CesiumViewState>) => void;
  destroy: () => void;
}