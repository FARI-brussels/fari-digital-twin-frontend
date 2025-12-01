/**
 * Tileset Queries and Mutations
 * Aligned with backend TilesetManager endpoints (api/tilesets)
 */
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import { createMutation } from '../utils/mutationFactory';
import { CACHE_CONFIG } from '../utils/cacheConfig';
import { buildAssetUrl } from '../utils/urlBuilder';
import type { Tileset, ResourceRecord } from '@/types';

// ============================================================================
// API Functions
// ============================================================================

/**
 * GET /api/tilesets - Fetch all tilesets
 */
async function fetchTilesets(): Promise<Tileset[]> {
  const records = await apiClient.get('api/tilesets').json<ResourceRecord[]>();

  if (!Array.isArray(records)) {
    throw new Error('Invalid API response: expected array');
  }

  return records.map(record => ({
    id: record.id,
    // New backend returns tileset_url for the JSON file path
    url: buildAssetUrl(record.tileset_url || record.url),
    name: record.filename || record.name,
    description: record.description,
    date: record.date,
  }));
}

/**
 * POST /api/tilesets - Upload a new tileset
 */
async function uploadTileset(formData: FormData): Promise<void> {
  await apiClient.post('api/tilesets', { body: formData });
}

/**
 * DELETE /api/tilesets/:id - Delete a tileset by ID
 */
async function deleteTilesetById(id: number): Promise<void> {
  await apiClient.delete(`api/tilesets/${id}`);
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useTilesetsQuery() {
  return useQuery({
    queryKey: queryKeys.tilesets.list(),
    queryFn: fetchTilesets,
    staleTime: CACHE_CONFIG.tilesets.staleTime,
    gcTime: CACHE_CONFIG.tilesets.gcTime,
  });
}

// ============================================================================
// Mutation Hooks (using factory)
// ============================================================================

export const useUploadTilesetMutation = createMutation(
  uploadTileset,
  [queryKeys.tilesets.all]
);

export const useDeleteTilesetByIdMutation = createMutation(
  deleteTilesetById,
  [queryKeys.tilesets.all]
);

/**
 * Delete tileset by URL - uses QueryClient cache to avoid extra API call
 */
export function useDeleteTilesetMutation() {
  const queryClient = useQueryClient();

  return createMutation(
    async (url: string) => {
      // Try to find ID from cache first
      const cached = queryClient.getQueryData<Tileset[]>(queryKeys.tilesets.list());
      let tilesetId = cached?.find(t => t.url === url)?.id;

      // If not in cache, fetch to find ID
      if (!tilesetId) {
        const records = await apiClient.get('api/tilesets').json<ResourceRecord[]>();
        const tileset = records.find(r => r.url === url);
        if (!tileset) {
          throw new Error(`Tileset not found with URL: ${url}`);
        }
        tilesetId = tileset.id;
      }

      await deleteTilesetById(tilesetId);
    },
    [queryKeys.tilesets.all]
  )();
}
