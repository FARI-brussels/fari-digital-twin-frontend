<template>
  <div class="tileset-viewer-wrapper">
      <div ref="viewerContainer" class="viewer-container"></div>
      <div v-if="loading" class="loading-indicator">Loading Tileset...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  tilesetUrl: {
    type: String,
    required: true,
  },
});

const viewerContainer = ref(null);
const loading = ref(true);
const error = ref(null);
let viewer;
let currentTileset = null;

const initializeViewer = () => {
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
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }),
    });
  }
};

const loadTileset = async (url) => {
  if (!viewer || !url) return;

  loading.value = true;
  error.value = null;

  try {
    if (currentTileset) {
      viewer.scene.primitives.remove(currentTileset);
    }
    
    const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
    currentTileset = viewer.scene.primitives.add(tileset);

    await viewer.zoomTo(tileset);

  } catch (err) {
    console.error('Failed to load tileset:', err);
    error.value = 'Error loading tileset. The URL might be invalid or inaccessible.';
  } finally {
    loading.value = false;
  }
};

watch(() => props.tilesetUrl, (newUrl) => {
  loadTileset(newUrl);
}, { immediate: true });

onMounted(() => {
  initializeViewer();
  if (props.tilesetUrl) {
    loadTileset(props.tilesetUrl);
  }
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});

</script>

<style scoped>
.tileset-viewer-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
}
.viewer-container {
  width: 100%;
  height: 100%;
}
.loading-indicator, .error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background-color: rgba(0,0,0,0.8);
  padding: 15px;
  border-radius: 5px;
  z-index: 10;
}
.error-message {
  color: #ffcccc;
}
</style> 