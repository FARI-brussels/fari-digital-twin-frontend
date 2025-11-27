/**
 * Asset Queries and Mutations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { Asset } from '@/types';

// ============================================================================
// API Functions
// ============================================================================

async function fetchAssets(): Promise<Asset[]> {
  return apiClient.get('assets-manager').json<Asset[]>();
}

async function uploadAsset(formData: FormData): Promise<Asset> {
  return apiClient.post('assets-manager/upload', { body: formData }).json<Asset>();
}

async function deleteAsset(url: string): Promise<void> {
  await apiClient.delete('assets-manager/delete', {
    searchParams: { url },
  });
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useAssetsQuery() {
  return useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: fetchAssets,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useUploadAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
    },
  });
}
