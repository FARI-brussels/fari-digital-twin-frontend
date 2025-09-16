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
const showWmsLayer = ref(true);
let viewer;
let currentTileset = null;
let wmsImageryLayer = null;

const initializeViewer = () => {
  if (viewerContainer.value && !viewer) {
    // Set Cesium Ion access token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhY2E3ZDhlNC03Yjc0LTQzM2QtYmI5My0zYWQ3NjIwOTk0OTciLCJpZCI6Mjc4NzM4LCJpYXQiOjE3NDA0ODg1MjB9.VsZjL6pbKSwR_SBbxUq-KRweOU_P3R8DKjSpeD0EICY';

    viewer = new Cesium.Viewer(viewerContainer.value, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }),
    });

    // Set terrain using the scene method
    viewer.scene.setTerrain(
      new Cesium.Terrain(
        Cesium.CesiumTerrainProvider.fromIonAssetId(3340034),
      ),
    );

    // Add WMS layer by default
    addWmsLayer();
  }
};

const addWmsLayer = () => {
  if (!viewer || wmsImageryLayer) return;
  try {
    const wmsProvider = new Cesium.WebMapServiceImageryProvider({
      url: 'https://geoservices-urbis.irisnet.be/geoserver/ows',
      layers: 'BaseMaps:UrbISNotLabeledColor',
      parameters: {
        service: 'WMS',
        format: 'image/png',
        transparent: true,
      }
    });
    wmsImageryLayer = viewer.imageryLayers.addImageryProvider(wmsProvider);
  } catch (err) {
    console.error('Failed to add WMS layer:', err);
  }
};

const removeWmsLayer = () => {
  if (viewer && wmsImageryLayer) {
    viewer.imageryLayers.remove(wmsImageryLayer);
    wmsImageryLayer = null;
  }
};

const toggleWmsLayer = () => {
  if (showWmsLayer.value) {
    addWmsLayer();
  } else {
    removeWmsLayer();
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

<template>
  <div class="w-full h-full relative bg-black">
    <div ref="viewerContainer" class="w-full h-full"></div>
    <div class="absolute top-2 right-2 z-10 bg-black/80 p-2 rounded flex items-center">
      <label class="flex items-center text-white text-sm cursor-pointer select-none">
        <input type="checkbox" v-model="showWmsLayer" @change="toggleWmsLayer" class="mr-2 cursor-pointer" />
        <span>UrbIS Base Map</span>
      </label>
    </div>
    <div v-if="loading"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-black/80 px-4 py-2 rounded z-10">
      Loading Tileset...</div>
    <div v-if="error"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 bg-black/80 px-4 py-2 rounded z-10">
      {{ error }}</div>
  </div>
</template>