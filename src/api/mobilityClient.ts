/**
 * Mobility Twin API Client - Ky instance for external mobility data
 *
 * Uses the ULB Mobility Twin API for realtime vehicle positions
 * (STIB, SNCB, Bolt, Dott, Telraam, etc.)
 */
import ky from 'ky';

/**
 * Mobility Twin API Endpoints Configuration
 *
 * The reason to use mobility twin here is because the harvester that computes
 * the vehicle position from the different STIB endpoints is not in the TS backend.
 * We could implement it in the TS backend later - to be discussed.
 */
export const MobilityEndpoints = {
  stib: '/stib/vehicle-position',
  sncb: '/sncb/vehicle-position',
  bolt: '/bolt/vehicle-position',
  dott: '/dott/vehicle-position',
  telraam: '/traffic/telraam',
  tunnels: '/traffic/tunnels',
  tunnelDevices: '/traffic/tunnel-devices',
  airQuality: '/environment/air-quality',
} as const;

export type MobilitySource = keyof typeof MobilityEndpoints;

/**
 * Ky client for Mobility Twin API
 */
export const mobilityTwinClient = ky.create({
  prefixUrl: 'https://api.mobilitytwin.brussels',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_TWIN_API_TOKEN}`,
  },
});

/**
 * Generic function to fetch data from Mobility Twin API
 */
export async function fetchMobilityData<T = unknown>(
  source: MobilitySource,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const endpoint = MobilityEndpoints[source];
  // Remove leading slash for Ky prefixUrl compatibility
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const searchParams = params
    ? new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      )
    : undefined;

  return mobilityTwinClient.get(cleanEndpoint, { searchParams }).json<T>();
}
