<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  assetUrl: string;
}

const props = defineProps<Props>();

// ============================================================================
// State
// ============================================================================

const viewerContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

let viewer: Cesium.Viewer | null = null;
let currentEntity: Cesium.Entity | null = null;

// Default position to place the model (e.g., somewhere in Brussels)
const defaultPosition = Cesium.Cartesian3.fromDegrees(4.3517, 50.8503, 0);

// ============================================================================
// Methods
// ============================================================================

function initializeViewer(): void {
  if (viewerContainer.value && !viewer) {
    viewer = new Cesium.Viewer(viewerContainer.value, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    // Add OpenStreetMap imagery layer
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      })
    );

    // Adjust camera to look at the default position
    viewer.camera.lookAt(
      defaultPosition,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0), // Heading
        Cesium.Math.toRadians(-45), // Pitch
        1500 // Range
      )
    );
  }
}

async function loadModel(url: string): Promise<void> {
  if (!viewer || !url) return;

  loading.value = true;
  error.value = null;

  try {
    if (currentEntity) {
      viewer.entities.remove(currentEntity);
    }

    const entity = viewer.entities.add({
      position: defaultPosition,
      model: {
        uri: url,
        minimumPixelSize: 128,
        maximumScale: 20000,
      },
    });
    currentEntity = entity;

    // Zoom to the newly loaded model
    await viewer.zoomTo(
      entity,
      new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(45), // Heading
        Cesium.Math.toRadians(-30), // Pitch
        200 // Range
      )
    );
  } catch (err) {
    console.error('Failed to load model:', err);
    error.value =
      'Error loading model. The URL might be invalid or the format is not supported by Cesium.';
  } finally {
    loading.value = false;
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(
  () => props.assetUrl,
  (newUrl: string) => {
    if (viewer && newUrl) {
      void loadModel(newUrl);
    }
  },
  { immediate: false }
);

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  void nextTick(() => {
    initializeViewer();
    if (props.assetUrl) {
      void loadModel(props.assetUrl);
    }
  });
});

onBeforeUnmount(() => {
  if (viewer) {
    if (currentEntity) {
      viewer.entities.remove(currentEntity);
    }
    viewer.destroy();
    viewer = null;
  }
});
</script>

<template>
  <div class="w-full h-full relative bg-black">
    <div ref="viewerContainer" class="w-full h-full"></div>
    <div
      v-if="loading"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-black/80 px-4 py-2 rounded z-10"
    >
      Loading Asset...
    </div>
    <div
      v-if="error"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 bg-black/80 px-4 py-2 rounded z-10"
    >
      {{ error }}
    </div>
  </div>
</template>
