<template>
  <div ref="wrapperRef" class="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
    <div ref="containerRef" class="absolute inset-0" />

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="loading || !ready || tilesetLoading"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Loader2 class="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading tileset...</p>
          <p class="text-slate-500 text-sm mt-1">This may take a moment</p>
        </div>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="tilesetError && !tilesetLoading"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 z-30"
      >
        <div class="text-center max-w-sm px-6">
          <div class="mx-auto mb-4 h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle class="h-8 w-8 text-red-500" />
          </div>
          <p class="text-red-700 font-semibold mb-2">Failed to load tileset</p>
          <p class="text-red-600/70 text-sm">{{ tilesetError }}</p>
          <button
            class="mt-4 px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium transition-colors"
            @click="retryLoad"
          >
            Try Again
          </button>
        </div>
      </div>
    </Transition>

    <div class="absolute top-4 right-4 z-10 pointer-events-auto">
      <label class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50 text-slate-700 text-sm font-medium cursor-pointer select-none hover:bg-white transition-colors">
        <input 
          v-model="showWmsLayer" 
          type="checkbox" 
          class="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/25"
        />
        <Map class="w-4 h-4 text-slate-500" />
        <span>UrbIS Base Map</span>
      </label>
    </div>

    <ViewerControls
      :show-rotation="true"
      :show-reset="true"
      :show-fullscreen="true"
      :show-corners="true"
      :fullscreen-target="wrapperRef"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @rotate-left="() => rotateLeft(30)"
      @rotate-right="() => rotateRight(30)"
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useCesiumViewer } from '@/composables/cesium';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { Loader2, AlertCircle, Map } from 'lucide-vue-next';
import type { Cesium3DTileset } from 'cesium';
import type {  ImageryLayer } from 'cesium'

const props = defineProps<{ tilesetUrl: string }>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const {
  viewer,
  ready,
  loading,
  addWMSLayer,
  removeWMSLayer,
  addTileset,
  removeTilesetByUrl,
  zoomIn,
  zoomOut,
  rotateLeft,
  rotateRight,
  resetView,
  configureControls,
} = useCesiumViewer({
  container: containerRef,
  initialViewState: {
    longitude: 4.36,
    latitude: 50.7,
    altitude: 10000,
    pitch: -32,
    bearing: 0,
  },
  enableCustomTerrain: true,
});

const showWmsLayer = ref(true);
const tilesetLoading = ref(false);
const tilesetError = ref<unknown | null>(null);
const currentUrl = ref<string | null>(null);
const currentTileset = ref<Cesium3DTileset | null>(null);

let urbisLayer: ImageryLayer | null = null;

onMounted(() => {
  watch(ready, (isReady) => {
    if (isReady) {
      configureControls({
        enableRotate: true,
        enableZoom: true,
        enableTilt: true,
        enableLook: true,
      });
    }
  }, { immediate: true });
});

watch(ready, (isReady) => {
  if (isReady && showWmsLayer.value && !urbisLayer) {
    urbisLayer = addWMSLayer(
      'https://geoservices-urbis.irisnet.be/geoserver/BaseMaps/ows',
      'UrbISNotLabeledGray',
      {
        opacity: 0.9,
        maximumLevel: 21,
        tileWidth: 512,
        tileHeight: 512,
        parameters: {
          transparent: true,
          format: 'image/png',
        },
      }
    );
  }
}, { immediate: true });

watch(showWmsLayer, (val) => {
  if (!ready.value) return;
  if (val && !urbisLayer) {
    urbisLayer = addWMSLayer(
      'https://geoservices-urbis.irisnet.be/geoserver/BaseMaps/ows',
      'UrbISNotLabeledGray',
      {
        opacity: 0.9,
        maximumLevel: 21,
        parameters: { transparent: true, format: 'image/png' },
      }
    );
  } else if (!val && urbisLayer) {
    removeWMSLayer(urbisLayer);
    urbisLayer = null;
  }
});

async function loadTileset(url: string, shouldZoom = true) {
  if (!url) return;  
  tilesetLoading.value = true;
  tilesetError.value = null;

  try {
    if (currentUrl.value && currentUrl.value !== url) {
      removeTilesetByUrl(currentUrl.value);
      currentTileset.value = null;
    }

    const tileset = await addTileset(url, {
      zoomTo: shouldZoom,
      maximumScreenSpaceError: 4,
      heading: 240,
      pitch: -25, 
      distanceMultiplier: 1.8, 
    });

    if (!tileset) {
      throw new Error('Tileset failed to load - returned null');
    }

    currentTileset.value = tileset;
    currentUrl.value = url;
  } catch (err: unknown) {
    console.error('[TilesetViewer] Load failed:', err);
    tilesetError.value = err || 'Could not load 3D tileset. It may be private or invalid.';
    currentTileset.value = null;
    currentUrl.value = null;
  } finally {
    tilesetLoading.value = false;
  }
}

function retryLoad() {
  if (props.tilesetUrl) {
    loadTileset(props.tilesetUrl, true);
  }
}

function handleReset() {
  if (viewer.value && currentTileset.value) {
    viewer.value.zoomTo(currentTileset.value);
  } else {
    resetView();
  }
}

watch(
  () => props.tilesetUrl,
  (newUrl, oldUrl) => {
    if (ready.value && newUrl && newUrl !== oldUrl) loadTileset(newUrl, true);
    
  }
);

watch(
  ready,
  (isReady) => {
    if (isReady && props.tilesetUrl && !currentUrl.value) loadTileset(props.tilesetUrl, true)
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (urbisLayer) removeWMSLayer(urbisLayer);
  if (currentUrl.value) removeTilesetByUrl(currentUrl.value);
});
</script>