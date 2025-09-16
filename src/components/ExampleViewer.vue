<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  example: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close']);

const cesiumContainer = ref(null);
const loading = ref(true);
const error = ref(null);
let viewer;

const activeLayers = computed(() => {
  return props.example.layers.filter(layer => layer.enabled);
});

onMounted(async () => {
  if (!cesiumContainer.value) return;

  try {
    viewer = new Cesium.Viewer(cesiumContainer.value, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: true,
      geocoder: true,
      homeButton: false,
      infoBox: true,
      sceneModePicker: false,
      selectionIndicator: true,
      timeline: false,
      navigationHelpButton: false,
    });

    // Add base layer if included
    const baseMapLayer = props.example.layers.find(layer => layer.type === 'basemap' && layer.enabled);
    if (baseMapLayer) {
      const baseLayer = new Cesium.ImageryLayer(new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }));
      viewer.imageryLayers.add(baseLayer);
    }

    // Load tilesets
    const tilesetLayers = props.example.layers.filter(layer => layer.type === 'tileset' && layer.enabled);
    if (tilesetLayers.length > 0) {
      const promises = tilesetLayers.map(layer => Cesium.Cesium3DTileset.fromUrl(layer.url));
      const loadedTilesets = await Promise.all(promises);

      loadedTilesets.forEach((loadedTs, index) => {
        const layerInfo = tilesetLayers[index];
        viewer.scene.primitives.add(loadedTs);
        if (layerInfo.style) {
          loadedTs.style = layerInfo.style;
        }
      });

      if (loadedTilesets.length > 0) {
        await viewer.zoomTo(loadedTilesets[0]);
      }
    }

    // Add WMS layers
    const wmsLayers = props.example.layers.filter(layer => layer.type === 'wms' && layer.enabled);
    wmsLayers.forEach(layer => {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapServiceImageryProvider({
          url: layer.url,
          layers: layer.layer,
          parameters: {
            service: 'WMS',
            transparent: true,
            format: 'image/png'
          },
        })
      );
    });

    // Add click handler for 3D features
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const feature = viewer.scene.pick(movement.position);
      if (feature instanceof Cesium.Cesium3DTileFeature) {
        const propertyNames = feature.getPropertyNames();
        let description = '<table class="cesium-infoBox-defaultTable"><tbody>';
        for (let i = 0; i < propertyNames.length; i++) {
          const name = propertyNames[i];
          const value = feature.getProperty(name);
          description += `<tr><th>${name}</th><td>${value}</td></tr>`;
        }
        description += '</tbody></table>';

        viewer.selectedEntity = new Cesium.Entity({
          name: 'Feature Properties',
          description: description,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

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
  }
});
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/70 z-[1000]">
    <div class="relative bg-white rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col overflow-hidden">
      <button
        class="absolute top-4 right-4 text-2xl font-bold bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-white z-[1010]"
        @click="$emit('close')">&times;</button>
      <div class="w-full h-full" ref="cesiumContainer"></div>
      <div v-if="loading"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-black/80 px-4 py-2 rounded z-[1005]">
        Loading Example...</div>
      <div v-if="error"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 bg-black/80 px-4 py-2 rounded z-[1005]">
        {{ error }}</div>
      <div
        class="absolute top-4 left-4 bg-gray-900/90 text-white p-4 rounded-lg z-[1001] max-w-xs max-h-[70vh] overflow-y-auto">
        <h3 class="text-green-500 mb-2">{{ example.name }}</h3>
        <p class="mb-4 text-sm">{{ example.description }}</p>
        <div>
          <h4 class="text-gray-300 text-xs mb-2">Active Layers:</h4>
          <div v-for="layer in activeLayers" :key="layer.id" class="mb-2 pb-2 border-b border-gray-700">
            <span class="font-bold text-sm">{{ layer.name }}</span>
            <span class="text-xs text-gray-400 uppercase">({{ layer.type }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.loading-indicator,
.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 5px;
  z-index: 1005;
}

.error-message {
  color: #ffcccc;
}

.sidebar {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(42, 42, 42, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 1001;
  max-width: 300px;
  max-height: 70vh;
  overflow-y: auto;
}

.sidebar h3 {
  margin: 0 0 10px 0;
  color: #42b983;
}

.example-description {
  margin: 0 0 15px 0;
  font-size: 14px;
  line-height: 1.4;
}

.layer-list h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #ccc;
}

.layer-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  padding: 5px 0;
  border-bottom: 1px solid #555;
}

.layer-name {
  font-weight: bold;
  font-size: 13px;
}

.layer-type {
  font-size: 11px;
  color: #aaa;
  text-transform: uppercase;
}
</style>