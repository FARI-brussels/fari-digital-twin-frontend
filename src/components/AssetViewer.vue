<template>
  <div class="asset-viewer-wrapper">
    <div ref="viewerContainer" class="viewer-container"></div>
    <div v-if="loading" class="loading-indicator">Loading Asset...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  assetUrl: {
    type: String,
    required: true,
  },
});

const viewerContainer = ref(null);
const loading = ref(true);
const error = ref(null);
let viewer;
let currentEntity = null;

// Default position to place the model (e.g., somewhere in Brussels)
const defaultPosition = Cesium.Cartesian3.fromDegrees(4.3517, 50.8503, 0);

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

    // Adjust camera to look at the default position
    viewer.camera.lookAt(defaultPosition, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),   // Heading
        Cesium.Math.toRadians(-45), // Pitch
        1500                        // Range
    ));
  }
};

const loadModel = async (url) => {
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
            maximumScale: 20000
        }
    });
    currentEntity = entity;
    
    // Zoom to the newly loaded model
    await viewer.zoomTo(entity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(45),  // Heading
        Cesium.Math.toRadians(-30), // Pitch
        200                         // Range
    ));

  } catch (err) {
    console.error('Failed to load model:', err);
    error.value = 'Error loading model. The URL might be invalid or the format is not supported by Cesium.';
  } finally {
    loading.value = false;
  }
};

watch(() => props.assetUrl, (newUrl) => {
  if (viewer && newUrl) {
    loadModel(newUrl);
  }
}, { immediate: false }); // Set immediate to false to avoid loading before viewer is ready on mount

onMounted(() => {
  nextTick(() => {
    initializeViewer();
    if (props.assetUrl) {
      loadModel(props.assetUrl);
    }
  });
});

onBeforeUnmount(() => {
  if (viewer) {
    if(currentEntity) {
        viewer.entities.remove(currentEntity);
    }
    viewer.destroy();
    viewer = null;
  }
});

</script>

<style scoped>
.asset-viewer-wrapper {
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