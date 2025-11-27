/**
 * Map Layer Queries and Mutations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { MapLayer } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface AddMapLayerPayload {
  url: string;
  layer: string;
  description: string;
}

export interface DeleteMapLayerPayload {
  url: string;
  layer: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchMapLayers(): Promise<MapLayer[]> {
  return apiClient.get('maps-manager/all').json<MapLayer[]>();
}

async function addMapLayer(payload: AddMapLayerPayload): Promise<MapLayer> {
  return apiClient
    .post('maps-manager/add_layer', {
      json: { layer: payload },
    })
    .json<MapLayer>();
}

async function deleteMapLayer(payload: DeleteMapLayerPayload): Promise<void> {
  await apiClient.delete('maps-manager/delete', {
    searchParams: {
      url: payload.url,
      layer: payload.layer,
    },
  });
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useMapLayersQuery() {
  return useQuery({
    queryKey: queryKeys.mapLayers.list(),
    queryFn: fetchMapLayers,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useAddMapLayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMapLayer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mapLayers.all });
    },
  });
}

export function useDeleteMapLayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMapLayer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mapLayers.all });
    },
  });
}
