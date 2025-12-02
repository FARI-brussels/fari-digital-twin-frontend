<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import maplibregl, { type IControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { RealtimeDataset, GeoJSONFeatureCollection } from '@/types';
import { fetchMobilityData, MobilityEndpoints, type MobilitySource } from '@/api/mobilityClient';
import { apiClient } from '@/api';
import { ComponentEndpoints, type ComponentSource } from '@/api/queries/components';
import { getLayerStyle, type LayerStyleConfig } from '@/lib/layerStyles';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, MapPin, X } from 'lucide-vue-next';

const props = defineProps<{
  dataset?: RealtimeDataset;
}>();

// eslint-disable-next-line no-undef
const container = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
let deckOverlay: MapboxOverlay | null = null;

// Data state
const geojsonData = ref<GeoJSONFeatureCollection | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const pollInterval = ref<number | null>(null);
const selectedInfo = ref<{ x: number; y: number; object: { properties: Record<string, unknown> } } | null>(null);
const currentStyle = ref<LayerStyleConfig | null>(null);
const currentZoom = ref(12);

/**
 * Calculate icon size based on zoom level
 * At zoom 12 (default), use base size
 * Smaller zoom = smaller icons, larger zoom = larger icons
 */
function getZoomAdjustedSize(baseSize: number): number {
  const minZoom = 8;
  const maxZoom = 18;
  const minScale = 0.3;
  const maxScale = 1.5;

  // Clamp zoom to range
  const zoom = Math.max(minZoom, Math.min(maxZoom, currentZoom.value));

  // Linear interpolation between min and max scale
  const scale = minScale + ((zoom - minZoom) / (maxZoom - minZoom)) * (maxScale - minScale);

  return Math.round(baseSize * scale);
}

// Determine source type from dataset ID
type SourceType = 'mobility' | 'component' | 'unknown';

function getSourceType(id: string): SourceType {
  if (id in MobilityEndpoints) return 'mobility';
  if (id in ComponentEndpoints) return 'component';
  return 'unknown';
}

/**
 * Normalize GeoJSON coordinates to numbers
 * Some APIs return coordinates as strings which DeckGL can't render
 * THIS SHOULD BE DONE IN BACKEND
 */
function normalizeGeoJSON(data: GeoJSONFeatureCollection): GeoJSONFeatureCollection {
  return {
    ...data,
    features: data.features.map(feature => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.coordinates.map(coord =>
          typeof coord === 'string' ? parseFloat(coord) : coord
        ) as [number, number] | [number, number, number],
      },
    })),
  };
}

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
    const sourceId = props.dataset.id;
    const sourceType = getSourceType(sourceId);
    
    // Update style configuration
    currentStyle.value = getLayerStyle(sourceId);
    let response: GeoJSONFeatureCollection;

    if (sourceType === 'mobility') {
      // Fetch from Mobility Twin API (returns normalized GeoJSON)
      response = await fetchMobilityData(sourceId as MobilitySource);
    } else if (sourceType === 'component') {
      // Fetch from backend component
      const endpoint = ComponentEndpoints[sourceId as ComponentSource];
      response = await apiClient.get(endpoint).json<GeoJSONFeatureCollection>();
    } else {
      throw new Error(`Unknown data source: ${sourceId}`);
    }

    // Normalize coordinates (some APIs return strings instead of numbers)
    geojsonData.value = normalizeGeoJSON(response);
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

    const baseSize = currentStyle.value?.iconSize || 40;
    const adjustedSize = getZoomAdjustedSize(baseSize);

    layers.push(
      new IconLayer({
        id: 'realtime-icons',
        data: pointData,
        pickable: true,
        iconAtlas: iconAtlas.value,
        iconMapping: iconMapping,
        getIcon: () => 'marker',
        getPosition: (d: any) => d.coordinates,
        getSize: adjustedSize,
        getColor: currentStyle.value?.iconColor || [255, 0, 0],
        // Smooth transitions when zoom changes
        transitions: {
          getSize: 200,
        },
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
    const styleProps = currentStyle.value;
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

  // Update icon sizes when zoom changes
  map.on('zoom', () => {
    if (map) {
      currentZoom.value = map.getZoom();
      updateLayers();
    }
  });
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
      <Badge v-if="loading" variant="outline" class="bg-background gap-2 py-1.5 px-3">
        <Loader2 class="h-3 w-3 animate-spin" />
        Updating...
      </Badge>
      <Badge v-if="error" variant="destructive" class="gap-2 py-1.5 px-3">
        <AlertCircle class="h-3 w-3" />
        {{ error }}
      </Badge>
      <Badge v-if="geojsonData" variant="secondary" class="gap-2 py-1.5 px-3">
        <MapPin class="h-3 w-3" />
        {{ geojsonData.features?.length || 0 }} items
      </Badge>
    </div>

    <!-- Tooltip / Feature Details Card -->
    <Card
      v-if="selectedInfo"
      class="absolute z-20 max-w-xs shadow-lg"
      :style="{
        left: `${selectedInfo.x}px`,
        top: `${selectedInfo.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }"
    >
      <CardHeader class="pb-2 pt-3 px-3">
        <div class="flex items-center justify-between gap-2">
          <CardTitle class="text-sm">Feature Details</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            @click="selectedInfo = null"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent class="px-3 pb-3 pt-0">
        <div class="space-y-1 text-sm">
          <div
            v-for="(value, key) in selectedInfo.object.properties"
            :key="key"
            class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5"
          >
            <span class="font-medium text-muted-foreground">{{ key }}</span>
            <span class="truncate text-foreground">{{ value }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Legend Card -->
    <Card
      v-if="currentStyle && currentStyle.legend"
      class="absolute bottom-8 right-4 z-10 shadow-lg py-2 gap-1"
    >
      <CardHeader class="py-0 px-3">
        <CardTitle class="text-xs font-medium">{{ currentStyle.legend.title }}</CardTitle>
      </CardHeader>
      <CardContent class="px-3 py-0">
        <div class="space-y-1">
          <div
            v-for="(item, index) in currentStyle.legend.items"
            :key="index"
            class="flex items-center gap-2 text-xs"
          >
            <div
              class="w-2.5 h-2.5 rounded-sm shrink-0"
              :style="{ backgroundColor: item.color }"
            />
            <span class="text-muted-foreground">{{ item.label }}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

