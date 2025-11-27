<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import maplibregl, { type IControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RealtimeDataset, VehicleGeoJSONCollection } from '@/types';
import { fetchMobilityData, type MobilitySource } from '@/lib/api';
import { getLayerStyle, type LayerStyleConfig } from '@/lib/layerStyles';

const props = defineProps<{
  dataset?: RealtimeDataset;
}>();

// eslint-disable-next-line no-undef
const container = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
let deckOverlay: MapboxOverlay | null = null;

// Data state
const geojsonData = ref<VehicleGeoJSONCollection | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const pollInterval = ref<number | null>(null);
const selectedInfo = ref<{ x: number; y: number; object: { properties: Record<string, unknown> } } | null>(null);
const currentStyle = ref<LayerStyleConfig | null>(null);

// Create icon atlas from emoji/unicode characters dynamically
const iconAtlas = computed(() => {
  if (!currentStyle.value?.iconEmoji) return '';
  
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(currentStyle.value.iconEmoji, 64, 64);
  
  return canvas.toDataURL();
});

const iconMapping = {
  marker: { x: 0, y: 0, width: 128, height: 128 },
};

// Fetch data function
async function fetchData() {
  if (!props.dataset) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    // Map the dataset ID/name to the MobilitySource key
    // Assuming the dataset.id corresponds to the keys in MobilityEndpoints (stib, sncb, etc.)
    const source = props.dataset.id as MobilitySource;
    
    // Update style configuration
    currentStyle.value = getLayerStyle(source);

    const response = await fetchMobilityData<VehicleGeoJSONCollection>(source);
    geojsonData.value = response.data;
  } catch (err) {
    console.error('Error fetching realtime data:', err);
    error.value = 'Failed to fetch realtime data';
  } finally {
    loading.value = false;
  }
}

// Update layers function
function updateLayers() {
  if (!deckOverlay || !geojsonData.value || !currentStyle.value) return;

  const layers = [];

  // Use IconLayer for vehicle types (icon-based)
  if (currentStyle.value.useIconLayer && currentStyle.value.iconEmoji) {
    // Extract point data from GeoJSON
    const pointData = geojsonData.value.features.map(feature => ({
      coordinates: feature.geometry.coordinates,
      properties: feature.properties,
    }));

    layers.push(
      new IconLayer({
        id: 'realtime-icons',
        data: pointData,
        pickable: true,
        iconAtlas: iconAtlas.value,
        iconMapping: iconMapping,
        getIcon: () => 'marker',
        getPosition: (d: any) => d.coordinates,
        getSize: currentStyle.value?.iconSize || 40,
        getColor: currentStyle.value?.iconColor || [255, 0, 0],
        onClick: (info: { object?: any; x: number; y: number }) => {
          if (info.object) {
            selectedInfo.value = {
              x: info.x,
              y: info.y,
              object: { properties: info.object.properties }
            };
          } else {
            selectedInfo.value = null;
          }
        },
      })
    );
  } else {
    // Use GeoJsonLayer for circles and lines
    const styleProps = currentStyle.value || {
      pointType: 'circle',
      getFillColor: [255, 0, 0, 200],
      getLineColor: [255, 255, 255],
      getPointRadius: 10,
      getLineWidth: 2,
    };

    layers.push(
      new GeoJsonLayer({
        id: 'realtime-geojson',
        data: geojsonData.value,
        pickable: true,
        stroked: true,
        filled: true,
        // Cast to any to bypass strict DeckGL typing mismatch with our loose config
        ...(styleProps as any),
        onClick: (info: { object?: { properties: Record<string, unknown> }; x: number; y: number }) => {
          if (info.object) {
            selectedInfo.value = {
              x: info.x,
              y: info.y,
              object: info.object
            };
          } else {
            selectedInfo.value = null;
          }
        },
      })
    );
  }

  deckOverlay.setProps({ layers });
}

// Watch for data changes to update map
watch(geojsonData, () => {
  updateLayers();
});

// Watch for dataset changes to refetch
watch(() => props.dataset, () => {
  if (pollInterval.value) clearInterval(pollInterval.value);
  geojsonData.value = null; // Clear previous data
  
  if (props.dataset) {
    void fetchData();
    // Start polling every 20 seconds
    pollInterval.value = window.setInterval(fetchData, 20000);
  }
}, { immediate: true });

onMounted(() => {
  if (!container.value) return;

  // Initialize MapLibre
  map = new maplibregl.Map({
    container: container.value,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [4.3517, 50.8503], // Brussels
    zoom: 12,
    pitch: 0,
    bearing: 0
  });

  // Initialize DeckGL Overlay
  deckOverlay = new MapboxOverlay({
    layers: [],
    interleaved: true, // Try interleaved mode
  });

  map.addControl(new maplibregl.NavigationControl());
  map.addControl(deckOverlay as unknown as IControl);

  // Clean up on unmount
});

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value);
  if (map) map.remove();
  if (deckOverlay) deckOverlay.finalize();
});
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="container" class="w-full h-full"></div>
    
    <!-- Status Indicators -->
    <div class="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div v-if="loading" class="bg-white px-3 py-1 rounded shadow text-sm">
        Updating...
      </div>
      <div v-if="error" class="bg-red-500 text-white px-3 py-1 rounded shadow text-sm">
        {{ error }}
      </div>
      <div v-if="geojsonData" class="bg-white px-3 py-1 rounded shadow text-sm">
        {{ geojsonData.features?.length || 0 }} items
      </div>
    </div>
    <!-- Tooltip -->
    <div
      v-if="selectedInfo"
      class="absolute z-20 bg-white p-3 rounded shadow-lg text-sm max-w-xs"
      :style="{ left: `${selectedInfo.x}px`, top: `${selectedInfo.y}px`, transform: 'translate(-50%, -100%)', marginTop: '-10px' }"
    >
      <div class="font-bold mb-1 border-b pb-1">Feature Details</div>
      <div v-for="(value, key) in selectedInfo.object.properties" :key="key" class="grid grid-cols-2 gap-2">
        <span class="font-semibold text-gray-600">{{ key }}:</span>
        <span class="truncate">{{ value }}</span>
      </div>
      <button 
        class="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1 rounded"
        @click="selectedInfo = null"
      >
        Close
      </button>
    </div>

    <!-- Legend -->
    <div 
      v-if="currentStyle && currentStyle.legend"
      class="absolute bottom-8 right-4 z-10 bg-white p-3 rounded shadow-lg text-sm"
    >
      <div class="font-bold mb-2 border-b pb-1">{{ currentStyle.legend.title }}</div>
      <div 
        v-for="(item, index) in currentStyle.legend.items" 
        :key="index"
        class="flex items-center mb-1"
      >
        <div 
          class="w-4 h-4 rounded mr-2" 
          :style="{ backgroundColor: item.color }"
        ></div>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

