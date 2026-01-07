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
        v-if="loading || !ready || dataLoading"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Loader2 class="h-6 w-6 text-violet-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading realtime data...</p>
          <p v-if="props.dataset" class="text-slate-500 text-sm mt-1">{{ props.dataset.name }}</p>
        </div>
      </div>
    </Transition>

    <div class="absolute top-4 right-4 z-10 pointer-events-auto flex flex-col gap-2">
      <div 
        v-if="props.dataset"
        class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50"
      >
        <Radio class="w-4 h-4 text-violet-500" />
        <span class="text-sm font-medium text-slate-700">{{ props.dataset.name }}</span>
      </div>

      <div 
        v-if="featureCount > 0"
        class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50"
      >
        <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <MapPin class="w-4 h-4 text-emerald-500" />
        <span class="text-sm font-medium text-slate-700">{{ featureCount }} items</span>
      </div>
    </div>

    <div class="absolute bottom-20 right-4 z-10 pointer-events-auto">
      <MapLegend 
        v-bind="legendData"
        :show-icon="true"
      />
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="selectedFeature"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-sm pointer-events-auto"
      >
        <div class="p-5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl shadow-slate-200/50">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-800">Feature Details</h3>
            <button
              class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              @click="closeFeatureDetails"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(value, key) in selectedFeature.properties"
              :key="key"
              class="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0"
            >
              <span class="text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[100px]">
                {{ String(key).replace(/_/g, ' ') }}
              </span>
              <span class="text-sm text-slate-700 flex-1">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { useCesiumViewer } from '@/composables/cesium';
import { ScreenSpaceEventHandler, ScreenSpaceEventType, defined, Cartesian2 } from 'cesium';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { MapLegend } from '@/components/ui/map-legend';
import { Loader2, MapPin, Radio, X } from 'lucide-vue-next';
import type { RealtimeDataset } from '@/types';
import { getLayerStyle } from '@/lib/layerStyles';

interface SelectedFeatureData {
  id: string;
  properties: Record<string, unknown>;
}

const props = defineProps<{
  dataset?: RealtimeDataset;
}>();

const wrapperRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const selectedFeature = ref<SelectedFeatureData | null>(null);
const dataLoading = ref(false);
const currentDatasetId = ref<string | null>(null);

const {
  viewer,
  ready,
  loading,
  featureCount,
  currentSourceId,
  startPolling,
  stopPolling,
  clear,
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
});

const legendData = computed(() => {
  const style = currentSourceId.value ? getLayerStyle(currentSourceId.value) : null;
  if (!style?.legend) return null;
  
  return {
    title: 'Legend',
    items: Array.isArray(style.legend) ?  style.legend : [style.legend],
  };
});

let clickHandler: ScreenSpaceEventHandler | null = null;

const cleanupClickHandler = (): void => {
  if (clickHandler) {
    clickHandler.destroy();
    clickHandler = null;
  }
};

const setupClickHandler = (): void => {
  if (!viewer.value || clickHandler) return;

  clickHandler = new ScreenSpaceEventHandler(viewer.value.scene.canvas);

  clickHandler.setInputAction((movement: { position: { x: number; y: number } }) => {
    const position = new Cartesian2(movement.position.x, movement.position.y);
    const pickedObject = viewer.value?.scene.pick(position);

    if (defined(pickedObject) && defined(pickedObject.id)) {
      const entity = pickedObject.id;

      if (viewer.value) viewer.value.selectedEntity = undefined;

      if (entity.properties) {
        const properties: Record<string, unknown> = {};
        const propertyNames = entity.properties.propertyNames;

        propertyNames.forEach((name: string) => {
          const value = entity.properties[name]?.getValue?.(viewer.value!.clock.currentTime);
          if (value !== undefined) properties[name] = value;
        });

        selectedFeature.value = {
          id: entity.id,
          properties,
        };
      }
    } else {
      selectedFeature.value = null;
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
};

const closeFeatureDetails = (): void => {
  selectedFeature.value = null;
};

async function loadDataset(dataset: RealtimeDataset) {
  if (!ready.value) return;
  

  selectedFeature.value = null;
  dataLoading.value = true;

  try {
    stopPolling();
    clear();

    await startPolling({
      options: {
        sourceId: dataset.id,
        pollInterval: 20000,
      },
    });

    currentDatasetId.value = dataset.id;
  } catch (err) {
    console.error('[RealtimeViewer] Failed to load dataset:', err);
  } finally {
    dataLoading.value = false;
  }
}

watch(
  () => props.dataset,
  (newDataset, oldDataset) => {
    if (ready.value && newDataset && newDataset.id !== oldDataset?.id) {
      loadDataset(newDataset);
    }
  }
);

watch(
  ready,
  (isReady) => {
    if (isReady) {
      configureControls({
        enableRotate: true,
        enableZoom: true,
        enableTilt: true,
        enableLook: true,
      });
      setupClickHandler();

      if (props.dataset && !currentDatasetId.value) {
        loadDataset(props.dataset);
      }
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  cleanupClickHandler();
  stopPolling();
  clear();
});
</script>