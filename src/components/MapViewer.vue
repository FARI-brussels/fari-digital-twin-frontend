<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const props = defineProps({
  mapLayer: {
    type: Object,
    required: true,
  },
});

const cesiumContainer = ref(null);
let viewer;
let currentImageryLayer = null;

const legendUrl = computed(() => {
  const layerInfo = props.mapLayer;
  if (layerInfo && layerInfo.url && layerInfo.layer) {
    const baseUrl = layerInfo.url.split('?')[0];
    return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerInfo.layer}`;
  }
  return '';
});

const initializeViewer = () => {
  if (cesiumContainer.value && !viewer) {
    viewer = new Cesium.Viewer(cesiumContainer.value, {
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }),
      sceneMode: Cesium.SceneMode.SCENE2D,
      baseLayerPicker: false,
      timeline: false,
      animation: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
    });
    viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(4.25, 50.75, 4.45, 50.95)
    });
  }
};

const updateMapLayer = (newMapLayer) => {
  if (viewer && newMapLayer && newMapLayer.url && newMapLayer.layer) {
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
          format: 'image/png'
        },
      })
    );
  }
};

watch(() => props.mapLayer, (newMapLayer) => {
  updateMapLayer(newMapLayer);
}, { immediate: true });

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
    <div v-if="legendUrl" class="absolute bottom-5 right-5 bg-white/80 p-2 rounded z-[1005]">
      <img :src="legendUrl" alt="Map Legend" class="max-w-[200px] max-h-[300px] block" />
    </div>
  </div>
</template>