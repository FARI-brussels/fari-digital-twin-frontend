<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">&times;</button>
      <div class="cesium-container" ref="cesiumContainer"></div>
      <div v-if="loading" class="loading-indicator">Loading Example...</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="sidebar">
        <h3>{{ example.name }}</h3>
        <p class="example-description">{{ example.description }}</p>
        <div class="layer-list">
          <h4>Active Layers:</h4>
          <div v-for="layer in activeLayers" :key="layer.id" class="layer-item">
            <span class="layer-name">{{ layer.name }}</span>
            <span class="layer-type">({{ layer.type }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: white;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 20px;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1010;
  color: #fff;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
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