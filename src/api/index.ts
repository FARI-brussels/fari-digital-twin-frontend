/**
 * API Module - Central exports
 */

// Client
export { apiClient } from './client';

// Query Keys
export { queryKeys } from './queryKeys';

// Assets
export { useAssetsQuery, useUploadAssetMutation, useDeleteAssetMutation } from './queries/assets';

// Map Layers
export {
  useMapLayersQuery,
  useAddMapLayerMutation,
  useDeleteMapLayerMutation,
  type AddMapLayerPayload,
  type DeleteMapLayerPayload,
} from './queries/mapLayers';

// Tilesets
export {
  useTilesetsQuery,
  useUploadTilesetMutation,
  useDeleteTilesetMutation,
} from './queries/tilesets';

// Vehicles
export { useVehiclePositionsQuery } from './queries/vehicles';
