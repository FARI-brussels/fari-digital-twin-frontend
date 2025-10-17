import { ref, onBeforeUnmount, type Ref } from 'vue';
import type { VehicleService } from '@/services/vehicleService';
import type { VehicleFeature, InterpolatedVehicle } from '@/types/vehicle';
import { getVehicleId, extractCoordinates, interpolate, getVehicleStyle } from '@/utils/vehicleUtils';

/**
 * Return type for useVehicleTracking composable
 */
interface UseVehicleTrackingReturn {
  vehicles: Ref<VehicleFeature[]>;
  interpolatedVehicles: Ref<InterpolatedVehicle[]>;
  vehicleCount: Ref<number>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  startTracking: () => void;
  stopTracking: () => void;
}

/**
 * Composable for vehicle tracking and interpolation
 * Single Responsibility: Manages vehicle data fetching, interpolation, and animation
 * Dependency Inversion: Depends on VehicleService abstraction, not concrete implementation
 */
export function useVehicleTracking(
  vehicleService: VehicleService,
  updateInterval: number = 20000
): UseVehicleTrackingReturn {
  const vehicles = ref<VehicleFeature[]>([]);
  const interpolatedVehicles = ref<InterpolatedVehicle[]>([]);
  const vehicleCount = ref<number>(0);
  const loading = ref<boolean>(true);
  const error = ref<string | null>(null);

  let previousSnapshot: VehicleFeature[] = [];
  let currentSnapshot: VehicleFeature[] = [];
  let snapshotTime: number = 0;
  let updateIntervalId: number | null = null;
  let animationFrameId: number | null = null;

  /**
   * Fetch vehicle positions from the service
   */
  async function fetchVehiclePositions(): Promise<void> {
    try {
      const vehicleData = await vehicleService.fetchVehiclePositions();

      // Store snapshots for interpolation
      previousSnapshot = currentSnapshot.length > 0 ? currentSnapshot : vehicleData;
      currentSnapshot = vehicleData;
      snapshotTime = Date.now();

      vehicles.value = vehicleData;
      vehicleCount.value = vehicleData.length;
      error.value = null;
      loading.value = false;

      // Start animation loop
      if (!animationFrameId) {
        animate();
      }
    } catch (err) {
      error.value = 'Failed to fetch vehicle positions';
      loading.value = false;
    }
  }

  /**
   * Animate vehicle positions with interpolation
   */
  function animate(): void {
    const now = Date.now();
    const elapsed = now - snapshotTime;
    const t = Math.min(elapsed / updateInterval, 1);

    // Interpolate positions between snapshots
    const interpolated = currentSnapshot
      .map((curr): InterpolatedVehicle | null => {
        let prev = previousSnapshot.find(p => getVehicleId(p) === getVehicleId(curr));
        if (!prev) prev = curr;

        const prevCoords = extractCoordinates(prev);
        const currCoords = extractCoordinates(curr);

        if (!prevCoords || !currCoords) return null;

        const vehicleId = getVehicleId(curr);
        if (!vehicleId) return null;

        return {
          id: vehicleId,
          longitude: interpolate(prevCoords.longitude, currCoords.longitude, t),
          latitude: interpolate(prevCoords.latitude, currCoords.latitude, t),
          routeId: currCoords.routeId,
          tripId: currCoords.tripId,
          ...getVehicleStyle()
        };
      })
      .filter((v): v is InterpolatedVehicle => v !== null);

    interpolatedVehicles.value = interpolated;
    animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Start tracking vehicles
   */
  function startTracking(): void {
    fetchVehiclePositions();

    // Update every interval
    updateIntervalId = window.setInterval(() => {
      fetchVehiclePositions();
    }, updateInterval);
  }

  /**
   * Stop tracking vehicles
   */
  function stopTracking(): void {
    if (updateIntervalId) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stopTracking();
  });

  return {
    vehicles,
    interpolatedVehicles,
    vehicleCount,
    loading,
    error,
    startTracking,
    stopTracking
  };
}
