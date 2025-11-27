/**
 * Tileset Queries and Mutations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { Tileset } from '@/types';

// ============================================================================
// API Functions
// ============================================================================

async function fetchTilesets(): Promise<Tileset[]> {
  return apiClient.get('tileset-manager').json<Tileset[]>();
}

async function uploadTileset(formData: FormData): Promise<Tileset> {
  return apiClient.post('tileset-manager/upload', { body: formData }).json<Tileset>();
}

async function deleteTileset(url: string): Promise<void> {
  await apiClient.delete('tileset-manager/delete', {
    searchParams: { url },
  });
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useTilesetsQuery() {
  return useQuery({
    queryKey: queryKeys.tilesets.list(),
    queryFn: fetchTilesets,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useUploadTilesetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadTileset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tilesets.all });
    },
  });
}

export function useDeleteTilesetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTileset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tilesets.all });
    },
  });
}
