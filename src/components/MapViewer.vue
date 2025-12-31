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
        v-if="loading || !ready"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Loader2 class="h-6 w-6 text-blue-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading map layer...</p>
        </div>
      </div>
    </Transition>

    <div v-if="legendUrl" class="absolute top-4 right-4 z-10 pointer-events-auto">
      <div class="p-3 rounded-xl bg-white/60 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50">
        <img 
          :src="legendUrl" 
          alt="Map legend" 
          class="max-w-[200px] rounded-lg"
          @error="legendError = true"
        />
      </div>
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
      @reset="resetView"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue';
import { useCesiumViewer } from '@/composables/cesium';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { Loader2 } from 'lucide-vue-next';
import type { MapLayer } from '@/types';

const props = defineProps<{ mapLayer: MapLayer | null }>();

const wrapperRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const legendError = ref(false);

const {
  viewer,
  ready,
  loading,
  addWMSLayer,
  removeWMSLayer,
  zoomIn,
  zoomOut,
  rotateLeft,
  rotateRight,
  resetView,
  configureControls,
} = useCesiumViewer({
  container: containerRef,
  initialViewState: {
    longitude: 4.3517,
    latitude: 50.8503,
    altitude: 4000,
    pitch: -45,
    bearing: 0,
  },
});

let currentLayer: unknown = null;

const legendUrl = computed(() => {
  if (legendError.value) return '';
  const l = props.mapLayer;
  if (!l?.url || !l.layer) return '';
  const base = l.url.split('?')[0];
  const layerHash = encodeURIComponent(l.layer).replace(/%/g, '');
  return `${base}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${encodeURIComponent(l.layer)}&v=${layerHash}`;
});

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

watch(
  () => props.mapLayer,
  async (newLayer) => {
    legendError.value = false;
    
    if (currentLayer) {
      removeWMSLayer(currentLayer);
      currentLayer = null;
    }

    if (newLayer?.url && newLayer.layer && viewer.value) {
      try {
        currentLayer = addWMSLayer(newLayer.url, newLayer.layer, {
          opacity: 0.9,
          parameters: {
            transparent: true,
            format: 'image/png',
          },
        });
        viewer.value.scene.requestRender();
      } catch (err) {
        console.error('Failed to add WMS layer:', err);
      }
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => currentLayer && removeWMSLayer(currentLayer));
</script>