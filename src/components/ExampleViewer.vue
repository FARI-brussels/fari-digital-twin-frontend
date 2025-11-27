<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { DemoExample, ExampleLayer } from '@/types';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  example: DemoExample;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// ============================================================================
// State
// ============================================================================

const cesiumContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

let viewer: Cesium.Viewer | null = null;

// ============================================================================
// Computed
// ============================================================================

const activeLayers = computed<ExampleLayer[]>(() => {
  return props.example.layers.filter((layer) => layer.enabled);
});

// ============================================================================
// Methods
// ============================================================================

function handleClose(): void {
  emit('close');
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  if (!cesiumContainer.value) return;

  try {
    const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (cesiumToken) {
      Cesium.Ion.defaultAccessToken = cesiumToken;
    }

    // Only use Ion terrain if token is available
    const viewerOptions: Cesium.Viewer.ConstructorOptions = {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: true,
      geocoder: !!cesiumToken, // Geocoder requires Ion token
      homeButton: false,
      infoBox: true,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: false,
    };

    if (cesiumToken) {
      viewerOptions.terrain = Cesium.Terrain.fromWorldTerrain();
    }

    viewer = new Cesium.Viewer(cesiumContainer.value, viewerOptions);

    // Add base layer if included
    const baseMapLayer = props.example.layers.find(
      (layer) => layer.type === 'basemap' && layer.enabled
    );
    if (baseMapLayer) {
      const baseLayer = new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/',
        })
      );
      viewer.imageryLayers.add(baseLayer);
    }

    // Load tilesets
    const tilesetLayers = props.example.layers.filter(
      (layer) => layer.type === 'tileset' && layer.enabled
    );
    if (tilesetLayers.length > 0) {
      const results = await Promise.allSettled(
        tilesetLayers
          .filter((layer) => layer.url)
          .map((layer) => Cesium.Cesium3DTileset.fromUrl(layer.url!))
      );

      const successfulTilesets: Cesium.Cesium3DTileset[] = [];

      results.forEach((result, index) => {
        const layerInfo = tilesetLayers[index];
        if (result.status === 'fulfilled') {
          const loadedTs = result.value;
          viewer?.scene.primitives.add(loadedTs);
          if (layerInfo?.style) {
            // Apply style if provided (style typing varies by Cesium version)
            loadedTs.style = new Cesium.Cesium3DTileStyle(
              layerInfo.style as Record<string, unknown>
            );
          }
          successfulTilesets.push(loadedTs);
        } else {
          console.error(
            `Failed to load tileset ${layerInfo?.name ?? layerInfo?.id ?? index}:`,
            result.reason
          );
        }
      });

      if (successfulTilesets.length > 0 && successfulTilesets[0]) {
        await viewer.zoomTo(successfulTilesets[0]);
      }
    }

    // Add WMS layers
    const wmsLayers = props.example.layers.filter(
      (layer) => layer.type === 'wms' && layer.enabled
    );
    wmsLayers.forEach((layer) => {
      if (!layer.url) return;
      viewer?.imageryLayers.addImageryProvider(
        new Cesium.WebMapServiceImageryProvider({
          url: layer.url,
          layers: layer.layer ?? '',
          parameters: {
            service: 'WMS',
            transparent: true,
            format: 'image/png',
          },
        })
      );
    });

    // Add click handler for 3D features
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(
      (movement: { position: Cesium.Cartesian2 }) => {
        if (!viewer) return;
        const feature = viewer.scene.pick(movement.position);
        if (feature instanceof Cesium.Cesium3DTileFeature) {
          // Get property IDs (available in newer Cesium versions)
          const propertyIds = feature.getPropertyIds?.() ?? [];
          let description = '<table class="cesium-infoBox-defaultTable"><tbody>';
          for (const name of propertyIds) {
            const value = feature.getProperty(name);
            description += `<tr><th>${name}</th><td>${value}</td></tr>`;
          }
          description += '</tbody></table>';

          viewer.selectedEntity = new Cesium.Entity({
            name: 'Feature Properties',
            description: description,
          });
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  } catch (err) {
    console.error('Failed to load example:', err);
    error.value = 'Error loading example. Some layers might be inaccessible.';
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/70 z-[1000]">
    <div
      class="relative bg-white rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col overflow-hidden"
    >
      <button
        class="absolute top-4 right-4 text-2xl font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-white z-[1010]"
        @click="handleClose"
      >
        &times;
      </button>
      <div ref="cesiumContainer" class="w-full h-full"></div>
      <div
        v-if="loading"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-black/80 px-4 py-2 rounded z-[1005]"
      >
        Loading Example...
      </div>
      <div
        v-if="error"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 bg-black/80 px-4 py-2 rounded z-[1005]"
      >
        {{ error }}
      </div>
      <div
        class="absolute top-4 left-4 bg-gray-900/90 text-white p-4 rounded-lg z-[1001] max-w-xs max-h-[70vh] overflow-y-auto"
      >
        <h3 class="text-green-500 mb-2">{{ example.name }}</h3>
        <p class="mb-4 text-sm">{{ example.description }}</p>
        <div>
          <h4 class="text-gray-300 text-xs mb-2">Active Layers:</h4>
          <div
            v-for="layer in activeLayers"
            :key="layer.id"
            class="mb-2 pb-2 border-b border-gray-700"
          >
            <span class="font-bold text-sm">{{ layer.name }}</span>
            <span class="text-xs text-gray-400 uppercase">({{ layer.type }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
