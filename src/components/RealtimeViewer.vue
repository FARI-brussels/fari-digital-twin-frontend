<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Deck, type MapViewState } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { apiClient } from '@/lib/api';
import type { RealtimeDataset, VehicleFeature, VehicleGeoJSONCollection } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface VehicleData {
  id: string;
  longitude: number;
  latitude: number;
  routeId?: string;
  color: [number, number, number];
}

interface ApiErrorResponse {
  response?: {
    status: number;
  };
  message?: string;
}

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  dataset: RealtimeDataset;
}

const props = defineProps<Props>();

// ============================================================================
// State
// ============================================================================

const mapContainer = ref<HTMLElement | null>(null);
const deckCanvas = ref<HTMLCanvasElement | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const vehicleCount = ref(0);
const lastUpdate = ref<string | null>(null);

let map: Map | null = null;
let deck: Deck | null = null;

// Brussels center
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 4.3517,
  latitude: 50.8503,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

// ============================================================================
// Methods
// ============================================================================

function initializeMap(): void {
  if (!mapContainer.value || !deckCanvas.value) return;

  try {
    // Initialize MapLibre
    map = new Map({
      container: mapContainer.value,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      interactive: false,
    });

    // Initialize Deck.gl
    deck = new Deck({
      canvas: deckCanvas.value,
      width: '100%',
      height: '100%',
      initialViewState: INITIAL_VIEW_STATE,
      controller: true,
      useDevicePixels: true,
      onViewStateChange: ({ viewState }) => {
        if (map) {
          map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch,
          });
        }
      },
      layers: [],
    });
  } catch (err) {
    console.error('Error initializing map:', err);
    error.value = 'Failed to initialize map viewer';
  }
}

async function fetchAndUpdateVehicles(): Promise<void> {
  if (!props.dataset || !deck) return;

  loading.value = true;
  error.value = null;

  try {
    const headers: Record<string, string> = {};
    const twinToken = import.meta.env.VITE_TWIN_API_TOKEN as string | undefined;

    if (twinToken) {
      headers.Authorization = `Bearer ${twinToken}`;
    }

    const response = await apiClient.get<VehicleGeoJSONCollection | VehicleFeature[]>(
      props.dataset.endpoint,
      { headers }
    );

    // Check if response is actually JSON
    if (typeof response.data === 'string') {
      throw new Error(
        'API returned invalid response format (expected JSON, got HTML/text). The endpoint may not exist or authentication is required.'
      );
    }

    let features: VehicleFeature[] = [];
    if (Array.isArray(response.data)) {
      features = response.data;
    } else if (response.data && typeof response.data === 'object' && 'features' in response.data) {
      features = response.data.features ?? [];
    } else {
      throw new Error('Unexpected API response format');
    }

    // Transform to vehicle data
    const vehicles: VehicleData[] = features
      .map((feature, index): VehicleData | null => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const vehicleId = String(
          feature.properties?.vehicleId ?? feature.properties?.id ?? `vehicle-${index}`
        );
        const routeId = String(
          feature.properties?.routeShortName ?? feature.properties?.routeId ?? ''
        );

        return {
          id: vehicleId,
          longitude: coords[0] as number,
          latitude: coords[1] as number,
          routeId,
          color: [255, 50, 50],
        };
      })
      .filter((v): v is VehicleData => v !== null);

    vehicleCount.value = vehicles.length;
    lastUpdate.value = new Date().toLocaleTimeString();

    updateLayers(vehicles);
  } catch (err: unknown) {
    console.error('Error fetching vehicle data:', err);
    const apiError = err as ApiErrorResponse;

    if (apiError.response) {
      const status = apiError.response.status;
      if (status === 404) {
        error.value = `API endpoint not found: ${props.dataset.endpoint}. Check your backend configuration.`;
      } else if (status === 401 || status === 403) {
        error.value =
          'Authentication required. Check your Keycloak login or VITE_TWIN_API_TOKEN.';
      } else {
        error.value = `Server error (${status}): ${apiError.message ?? 'Unknown error'}`;
      }
    } else if (apiError.message) {
      error.value = apiError.message;
    } else {
      error.value = 'Failed to fetch vehicle positions. Check console for details.';
    }
  } finally {
    loading.value = false;
  }
}

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
      autoHighlight: true,
    }),
    new TextLayer<VehicleData>({
      id: 'vehicle-labels',
      data: vehicles.filter((d) => d.routeId),
      getPosition: (d: VehicleData) => [d.longitude, d.latitude],
      getText: (d: VehicleData) => d.routeId ?? '',
      getSize: 12,
      getColor: [255, 255, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      background: true,
      getBackgroundColor: [0, 0, 0, 180],
      backgroundPadding: [2, 1],
    }),
  ];

  deck.setProps({ layers });
}

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

// ============================================================================
// Watchers
// ============================================================================

watch(
  () => props.dataset,
  (newDataset: RealtimeDataset) => {
    if (newDataset && deck) {
      void fetchAndUpdateVehicles();
    }
  }
);

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  initializeMap();
  if (props.dataset) {
    void fetchAndUpdateVehicles();
  }
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<template>
  <div class="relative w-full h-full">
    <!-- MapLibre container -->
    <div ref="mapContainer" class="absolute inset-0 w-full h-full"></div>

    <!-- Deck.gl canvas overlay -->
    <canvas
      ref="deckCanvas"
      class="absolute inset-0 z-[1] pointer-events-auto bg-transparent"
    ></canvas>

    <!-- Control Panel -->
    <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-3 space-y-2 z-10">
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
            : 'bg-blue-600 text-white hover:bg-blue-700',
        ]"
      >
        {{ loading ? 'Updating...' : 'Update Data' }}
      </button>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 rounded-lg px-4 py-3 max-w-sm z-10"
    >
      <p class="text-sm">{{ error }}</p>
    </div>
  </div>
</template>
