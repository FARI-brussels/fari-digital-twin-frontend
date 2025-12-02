<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { MapLayer } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-vue-next';

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  mapLayer: MapLayer;
}

const props = defineProps<Props>();

// ============================================================================
// State
// ============================================================================

const cesiumContainer = ref<HTMLDivElement | null>(null);

let viewer: Cesium.Viewer | null = null;
let currentImageryLayer: Cesium.ImageryLayer | null = null;

// ============================================================================
// Computed
// ============================================================================

const legendUrl = computed<string>(() => {
  const layerInfo = props.mapLayer;
  if (layerInfo?.url && layerInfo.layer) {
    const baseUrl = layerInfo.url.split('?')[0];
    return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerInfo.layer}`;
  }
  return '';
});

// ============================================================================
// Methods
// ============================================================================

function initializeViewer(): void {
  if (cesiumContainer.value && !viewer) {
    viewer = new Cesium.Viewer(cesiumContainer.value, {
      sceneMode: Cesium.SceneMode.SCENE2D,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
    });

    // Add OpenStreetMap imagery layer
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      })
    );
    viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(4.25, 50.75, 4.45, 50.95),
    });
  }
}

function updateMapLayer(newMapLayer: MapLayer): void {
  if (viewer && newMapLayer?.url && newMapLayer.layer) {
    if (currentImageryLayer) {
      viewer.imageryLayers.remove(currentImageryLayer, false);
    }

    currentImageryLayer = viewer.imageryLayers.addImageryProvider(
      new Cesium.WebMapServiceImageryProvider({
        url: newMapLayer.url,
        layers: newMapLayer.layer,
        parameters: {
          service: 'WMS',
          transparent: true,
          format: 'image/png',
        },
      })
    );
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(
  () => props.mapLayer,
  (newMapLayer: MapLayer) => {
    updateMapLayer(newMapLayer);
  },
  { immediate: true }
);

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  initializeViewer();
  updateMapLayer(props.mapLayer);
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>

<template>
  <div class="w-full h-full relative bg-black">
    <div ref="cesiumContainer" class="w-full h-full"></div>

    <!-- Legend Card -->
    <Card
      v-if="legendUrl"
      class="absolute bottom-4 right-4 z-[1005] shadow-lg py-2 gap-1 bg-background/95 backdrop-blur-sm"
    >
      <CardHeader class="py-0 px-3">
        <div class="flex items-center gap-2">
          <Map class="w-3.5 h-3.5 text-muted-foreground" />
          <CardTitle class="text-xs font-medium">Legend</CardTitle>
        </div>
      </CardHeader>
      <CardContent class="px-3 py-0 pt-1">
        <img
          :src="legendUrl"
          alt="Map Legend"
          class="max-w-[180px] max-h-[250px] block rounded"
        />
      </CardContent>
    </Card>
  </div>
</template>
