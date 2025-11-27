/**
 * Vehicle Queries (Realtime Data)
 */
import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';
import { apiClient } from '../client';
import { queryKeys } from '../queryKeys';
import type { VehicleGeoJSONCollection, VehicleFeature } from '@/types';

// ============================================================================
// API Functions
// ============================================================================

async function fetchVehiclePositions(
  endpoint: string
): Promise<VehicleGeoJSONCollection | VehicleFeature[]> {
  // Remove leading slash if present since prefixUrl handles base URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return apiClient.get(cleanEndpoint).json<VehicleGeoJSONCollection | VehicleFeature[]>();
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useVehiclePositionsQuery(
  endpoint: MaybeRefOrGetter<string>,
  options?: {
    refetchInterval?: number;
    enabled?: MaybeRefOrGetter<boolean>;
  }
) {
  return useQuery({
    queryKey: queryKeys.vehicles.positions(toValue(endpoint)),
    queryFn: () => fetchVehiclePositions(toValue(endpoint)),
    refetchInterval: options?.refetchInterval ?? 10000, // Default 10s refresh
    enabled: options?.enabled,
  });
}
