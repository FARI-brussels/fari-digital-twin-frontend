<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from 'vue';
import { vehicleService } from '@/services/vehicleService';
import { useVehicleTracking } from '@/composables/useVehicleTracking';
import { useMapViewer, type ViewState } from '@/composables/useMapViewer';

/**
 * RealtimeViewer Component
 *
 * Dependency Inversion: Depends on abstractions (composables, services)
 * Single Responsibility: Orchestrates composables and renders UI
 * Open/Closed: Easy to extend with new features via composition
 */

// Refs for DOM elements
const mapContainer = ref<HTMLElement | null>(null);
const deckCanvas = ref<HTMLCanvasElement | null>(null);

// Brussels center - could be extracted to a config
const INITIAL_VIEW_STATE: ViewState = {
  longitude: 4.3517,
  latitude: 50.8503,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

// Performance metrics
const fps: Ref<number> = ref(0);
const memoryUsage: Ref<number> = ref(0);

// Use composables (Dependency Inversion Principle)
const {
  interpolatedVehicles,
  vehicleCount,
  loading,
  error: trackingError,
  startTracking
} = useVehicleTracking(vehicleService, 20000);

const {
  error: mapError,
  initializeMap,
  updateLayers
} = useMapViewer(INITIAL_VIEW_STATE);

// Combined error state
const error: Ref<string | null> = ref(null);
watch([trackingError, mapError], ([tError, mError]) => {
  error.value = tError || mError;
});

// Performance monitoring (could be extracted to usePerformanceMonitor composable)
let frameCount = 0;
let lastTime = performance.now();

function startPerformanceMonitoring(): void {
  const measurePerformance = (): void => {
    frameCount++;
    const now = performance.now();

    if (now >= lastTime + 1000) {
      fps.value = Math.round((frameCount * 1000) / (now - lastTime));
      frameCount = 0;
      lastTime = now;

      if (performance.memory) {
        memoryUsage.value = Math.round((performance.memory as any).usedJSHeapSize / 1048576);
      }
    }

    requestAnimationFrame(measurePerformance);
  };

  measurePerformance();
}

// Initialize on mount
onMounted(() => {
  if (mapContainer.value && deckCanvas.value) {
    initializeMap(mapContainer.value, deckCanvas.value, () => {
      startTracking();
      startPerformanceMonitoring();
    });
  }
});

// Update layers when interpolated vehicles change
watch(interpolatedVehicles, (vehicles) => {
  updateLayers(vehicles);
}, { deep: true });
</script>

<style scoped>
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}
</style>

<template>
  <div class="relative w-full h-full">
    <!-- MapLibre container -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Deck.gl canvas overlay -->
    <canvas
      ref="deckCanvas"
      class="absolute inset-0"
      style="z-index: 1; pointer-events: auto; background: transparent;"
    ></canvas>

    <!-- Performance HUD -->
    <div
      v-if="!loading && !error"
      class="absolute top-4 left-4 bg-black/80 text-white rounded-lg px-4 py-3 font-mono text-xs space-y-1"
      style="z-index: 10;"
    >
      <div class="flex items-center gap-2">
        <span class="text-green-400">●</span>
        <span>FPS: {{ fps }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-blue-400">●</span>
        <span>Vehicles: {{ vehicleCount }}</span>
      </div>
      <div v-if="memoryUsage > 0" class="flex items-center gap-2">
        <span class="text-yellow-400">●</span>
        <span>Memory: {{ memoryUsage }} MB</span>
      </div>
    </div>

    <!-- Loading/Error -->
    <div
      v-if="loading"
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg px-6 py-4"
      style="z-index: 10;"
    >
      <p class="text-sm text-gray-700">Loading vehicle positions...</p>
    </div>

    <div
      v-if="error"
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 rounded-lg px-6 py-4"
      style="z-index: 10;"
    >
      <p class="text-sm">{{ error }}</p>
    </div>
  </div>
</template>
