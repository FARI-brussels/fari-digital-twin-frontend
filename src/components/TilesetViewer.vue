<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  tilesetUrl: string;
}

const props = defineProps<Props>();

// ============================================================================
// State
// ============================================================================

const viewerContainer = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showWmsLayer = ref(true);

let viewer: Cesium.Viewer | null = null;
let currentTileset: Cesium.Cesium3DTileset | null = null;
let wmsImageryLayer: Cesium.ImageryLayer | null = null;

// ============================================================================
// Methods
// ============================================================================

function initializeViewer(): void {
  if (viewerContainer.value && !viewer) {
    // Set Cesium Ion access token
    const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (cesiumToken) {
      Cesium.Ion.defaultAccessToken = cesiumToken;
    }

    viewer = new Cesium.Viewer(viewerContainer.value, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: true,
      navigationHelpButton: false,
      infoBox: true,
    });

    // Add OpenStreetMap imagery layer
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      })
    );

    // Set terrain using the scene method
    viewer.scene.setTerrain(new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromIonAssetId(3340034)));

    // Add WMS layer by default
    addWmsLayer();
  }
}

function addWmsLayer(): void {
  if (!viewer || wmsImageryLayer) return;

  try {
    const wmsProvider = new Cesium.WebMapServiceImageryProvider({
      url: 'https://geoservices-urbis.irisnet.be/geoserver/BaseMaps/ows',
      layers: 'UrbISNotLabeledGray',
      parameters: {
        service: 'WMS',
        format: 'image/png',
        transparent: true,
      },
    });

    wmsImageryLayer = viewer.imageryLayers.addImageryProvider(wmsProvider);
  } catch (err) {
    console.error('Failed to add WMS layer:', err);
  }
}

function removeWmsLayer(): void {
  if (viewer && wmsImageryLayer) {
    viewer.imageryLayers.remove(wmsImageryLayer);
    wmsImageryLayer = null;
  }
}

function toggleWmsLayer(): void {
  if (showWmsLayer.value) {
    addWmsLayer();
  } else {
    removeWmsLayer();
  }
}

async function loadTileset(url: string): Promise<void> {
  if (!viewer || !url) return;

  loading.value = true;
  error.value = null;

  try {
    if (currentTileset) {
      viewer.scene.primitives.remove(currentTileset);
    }

    const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
    currentTileset = viewer.scene.primitives.add(tileset) as Cesium.Cesium3DTileset;

    await viewer.zoomTo(tileset);
  } catch (err) {
    console.error('Failed to load tileset:', err);
    error.value = 'Error loading tileset. The URL might be invalid or inaccessible.';
  } finally {
    loading.value = false;
  }
}

// ============================================================================
// Watchers
// ============================================================================

watch(
  () => props.tilesetUrl,
  (newUrl: string) => {
    void loadTileset(newUrl);
  },
  { immediate: true }
);

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  initializeViewer();
  if (props.tilesetUrl) {
    void loadTileset(props.tilesetUrl);
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
    <div class="absolute top-2.5 right-2.5 z-[100] bg-black/80 p-2.5 rounded">
      <label class="flex items-center text-white text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="showWmsLayer"
          class="mr-2 cursor-pointer"
          @change="toggleWmsLayer"
        />
        <span class="cursor-pointer">UrbIS Base Map</span>
      </label>
    </div>
    <div
      v-if="loading"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-black/80 px-4 py-2 rounded z-10"
    >
      Loading Tileset...
    </div>
    <div
      v-if="error"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-200 bg-black/80 px-4 py-2 rounded z-10"
    >
      {{ error }}
    </div>
  </div>
</template>
