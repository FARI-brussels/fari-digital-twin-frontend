<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiClient } from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  type: string;
}

interface VehicleData {
  id: string;
  longitude: number;
  latitude: number;
  routeId?: string;
  color: number[];
}

const props = defineProps<{
  dataset: Dataset;
}>();

// DOM refs
const mapContainer = ref<HTMLElement | null>(null);
const deckCanvas = ref<HTMLCanvasElement | null>(null);

// State
const loading = ref(false);
const error = ref<string | null>(null);
const vehicleCount = ref(0);
const lastUpdate = ref<string | null>(null);

// Map instances
let map: Map | null = null;
let deck: Deck | null = null;

// Brussels center
const INITIAL_VIEW_STATE = {
  longitude: 4.3517,
  latitude: 50.8503,
  zoom: 12,
  pitch: 0,
  bearing: 0
};

/**
 * Initialize MapLibre and Deck.gl
 */
function initializeMap(): void {
  if (!mapContainer.value || !deckCanvas.value) return;

  try {
    // Initialize MapLibre
    map = new Map({
      container: mapContainer.value,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      interactive: false
    });

    // Initialize Deck.gl
    deck = new Deck({
      canvas: deckCanvas.value,
      width: '100%',
      height: '100%',
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      useDevicePixels: true,
      parameters: {
        clearColor: [0, 0, 0, 0]
      },
      onViewStateChange: ({ viewState }) => {
        if (map) {
          map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch
          });
        }
      },
      layers: []
    });
  } catch (err) {
    console.error('Error initializing map:', err);
    error.value = 'Failed to initialize map viewer';
  }
}

/**
 * Fetch vehicle data and update map
 */
async function fetchAndUpdateVehicles(): Promise<void> {
  if (!props.dataset || !deck) return;

  loading.value = true;
  error.value = null;

  try {
    console.log('[DEBUG] VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    console.log('[DEBUG] Endpoint:', props.dataset.endpoint);

    const headers: Record<string, string> = {};
    const twinToken = import.meta.env.VITE_TWIN_API_TOKEN;

    console.log('[DEBUG] VITE_TWIN_API_TOKEN exists:', !!twinToken);
    console.log('[DEBUG] Token length:', twinToken?.length);

    if (twinToken) {
      headers.Authorization = `Bearer ${twinToken}`;
      console.log('[DEBUG] Authorization header set');
    } else {
      console.warn('[DEBUG] No TWIN API token found!');
    }

    console.log('[DEBUG] Request headers:', headers);

    const response = await apiClient.get(props.dataset.endpoint, { headers });

    // Check if response is actually JSON
    if (typeof response.data === 'string') {
      console.error('API returned HTML/text instead of JSON:', response.data.substring(0, 200));
      throw new Error('API returned invalid response format (expected JSON, got HTML/text). The endpoint may not exist or authentication is required.');
    }

    let features: any[] = [];
    if (Array.isArray(response.data)) {
      features = response.data;
    } else if (response.data && typeof response.data === 'object' && 'features' in response.data) {
      features = response.data.features || [];
    } else {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected API response format');
    }

    // Transform to vehicle data
    const vehicles: VehicleData[] = features
      .map((feature, index) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const vehicleId = feature.properties?.vehicleId ||
                         feature.properties?.id ||
                         `vehicle-${index}`;
        const routeId = feature.properties?.routeShortName ||
                       feature.properties?.routeId ||
                       '';

        return {
          id: vehicleId,
          longitude: coords[0],
          latitude: coords[1],
          routeId,
          color: [255, 50, 50] // Red color for all vehicles
        };
      })
      .filter((v): v is VehicleData => v !== null);

    vehicleCount.value = vehicles.length;
    lastUpdate.value = new Date().toLocaleTimeString();

    // Update Deck.gl layers
    updateLayers(vehicles);

  } catch (err: any) {
    console.error('Error fetching vehicle data:', err);

    // Provide more helpful error messages
    if (err.response) {
      const status = err.response.status;
      if (status === 404) {
        error.value = `API endpoint not found: ${props.dataset.endpoint}. Check your backend configuration.`;
      } else if (status === 401 || status === 403) {
        error.value = 'Authentication required. Check your Keycloak login or VITE_TWIN_API_TOKEN.';
      } else {
        error.value = `Server error (${status}): ${err.message}`;
      }
    } else if (err.message) {
      error.value = err.message;
    } else {
      error.value = 'Failed to fetch vehicle positions. Check console for details.';
    }
  } finally {
    loading.value = false;
  }
}

/**
 * Update Deck.gl layers with vehicle data
 */
function updateLayers(vehicles: VehicleData[]): void {
  if (!deck) return;

  const layers = [
    new ScatterplotLayer<VehicleData>({
      id: 'vehicle-points',
      data: vehicles,
      getPosition: (d: VehicleData) => [d.longitude, d.latitude],
      getFillColor: (d: VehicleData) => d.color,
      getRadius: 10,
      radiusMinPixels: 8,
      radiusMaxPixels: 16,
      lineWidthMinPixels: 2,
      getLineColor: [255, 255, 255],
      stroked: true,
      filled: true,
      pickable: true,
      autoHighlight: true
    }),
    new TextLayer<VehicleData>({
      id: 'vehicle-labels',
      data: vehicles.filter(d => d.routeId),
      getPosition: (d: VehicleData) => [d.longitude, d.latitude],
      getText: (d: VehicleData) => d.routeId || '',
      getSize: 12,
      getColor: [255, 255, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      background: true,
      getBackgroundColor: [0, 0, 0, 180],
      backgroundPadding: [2, 1]
    })
  ];

  deck.setProps({ layers });
}

/**
 * Cleanup
 */
function cleanup(): void {
  if (deck) {
    deck.finalize();
    deck = null;
  }
  if (map) {
    map.remove();
    map = null;
  }
}

// Watch for dataset changes
watch(() => props.dataset, (newDataset) => {
  if (newDataset && deck) {
    fetchAndUpdateVehicles();
  }
});

onMounted(() => {
  initializeMap();
  if (props.dataset) {
    fetchAndUpdateVehicles();
  }
});

onBeforeUnmount(() => {
  cleanup();
});
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

    <!-- Control Panel -->
    <div
      class="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-3 space-y-2"
      style="z-index: 10;"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="text-sm">
          <div class="font-bold text-gray-700">Vehicles: {{ vehicleCount }}</div>
          <div v-if="lastUpdate" class="text-xs text-gray-500">Updated: {{ lastUpdate }}</div>
        </div>
      </div>

      <button
        @click="fetchAndUpdateVehicles"
        :disabled="loading"
        :class="[
          'w-full px-4 py-2 rounded font-medium transition-colors',
          loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        ]"
      >
        {{ loading ? 'Updating...' : 'Update Data' }}
      </button>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 rounded-lg px-4 py-3 max-w-sm"
      style="z-index: 10;"
    >
      <p class="text-sm">{{ error }}</p>
    </div>
  </div>
</template>
