<template>
  <div ref="wrapperRef" class="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
    <div ref="containerRef" class="w-full h-full" />

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isLoading || !ready"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 z-20"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Loader2 class="h-6 w-6 text-amber-500 animate-spin" />
          </div>
          <p class="text-slate-700 font-medium">Loading asset...</p>
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
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useCesiumViewer } from '@/composables/cesium';
import { Cartesian3, Matrix4 } from 'cesium';
import { ViewerControls } from '@/components/ui/viewer-controls';
import { Loader2 } from 'lucide-vue-next';

const {
  assetUrl,
  position = [4.3517, 50.8503, 0],
  scale = 3,
  rotation = [0, 0, 0],
  cameraDistance = 80,
  cameraPitch = -30,
} = defineProps<{
  assetUrl: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  cameraDistance?: number;
  cameraPitch?: number;
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);

const {
  viewer,
  loading: viewerLoading,
  ready,
  add3DModel,
  removeModel,
  lookAtModel,
  zoomIn,
  zoomOut,
  rotateLeft,
  rotateRight,
  configureControls,
} = useCesiumViewer({
  container: containerRef,
  initialViewState: {
    longitude: position[0],
    latitude: position[1],
    altitude: cameraDistance,
    pitch: cameraPitch,
    bearing: 45,
  },
});

const currentEntity = ref<unknown>(null);
const modelLoading = ref(false);

const isLoading = computed(() => viewerLoading.value || modelLoading.value);

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

function handleReset() {
  if (!currentEntity.value) return;

  const modelPosition = Cartesian3.fromDegrees(...position);
  const distance = cameraDistance || scale * 25;

  lookAtModel(modelPosition, distance, cameraPitch);

  if (viewer.value) {
    viewer.value.camera.lookAtTransform(Matrix4.IDENTITY);
    viewer.value.scene.requestRender();
  }
}

const loadModel = async (url: string) => {
  if (!url || !url.startsWith('http')) {
    console.error('Invalid model URL');
    return;
  }

  if (!viewer.value || !ready.value) {
    console.warn('Viewer not ready yet');
    return;
  }

  if (modelLoading.value) {
    console.warn('Model load already in progress');
    return;
  }

  modelLoading.value = true;

  try {
    if (currentEntity.value) {
      removeModel(currentEntity.value);
      currentEntity.value = null;
    }

    currentEntity.value = await add3DModel(url, position, {
      scale: scale,
      rotation: rotation,
      minimumPixelSize: 64,
      maximumScale: 20000,
    });

    await new Promise(resolve => requestAnimationFrame(resolve));

    const modelPosition = Cartesian3.fromDegrees(...position);
    const distance = cameraDistance || scale * 25;

    lookAtModel(modelPosition, distance, cameraPitch);

    if (viewer.value) {
      viewer.value.camera.lookAtTransform(Matrix4.IDENTITY);
      viewer.value.scene.requestRender();
    }
  } catch (err: unknown) {
    console.error('Model loading error:', err);
  } finally {
    modelLoading.value = false;
  }
};

watch(
  [ready, () => assetUrl],
  ([isReady, url]) => {
    if (isReady && url) setTimeout(() => loadModel(url), 100);
  },
  { immediate: true }
);

watch(
  () => [scale, rotation, position, cameraDistance, cameraPitch],
  () => {
    if (ready.value && assetUrl) {
      loadModel(assetUrl);
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (currentEntity.value) {
    removeModel(currentEntity.value);
    currentEntity.value = null;
  }
});
</script>