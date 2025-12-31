// src/composables/cesium/index.ts
import { type ShallowRef } from 'vue';
import type { Viewer } from 'cesium';

import { useViewer } from './core/useViewer';
import { useWMS } from './layers/useWMS';
import { use3DModels } from './assets/use3DModels';
import { useTilesets } from './assets/useTilesets';
import { useCamera } from './camera/useCamera';
import { useRealtimeData } from './layers/useRealtimeData';
import type { CesiumViewerOptions } from '@/types/Cesium';

export function useCesiumViewer(options: CesiumViewerOptions) {
  const core = useViewer(options);
  const viewerRef: ShallowRef<Viewer | null> = core.viewer;

  const wms = useWMS(viewerRef);
  const models = use3DModels(viewerRef);
  const tilesets = useTilesets(viewerRef);
  const camera = useCamera(viewerRef);
  const realtime = useRealtimeData(viewerRef);

  if (options.initialViewState) {
    camera.setInitialViewState(options.initialViewState);
  }

  return {
    setBasemap: core.setBasemap,
    viewer: core.viewer,
    ready: core.ready,
    loading: core.loading,
    error: core.error,
    destroy: core.destroy,
    ...wms,
    ...models,
    addTileset: tilesets.addTileset,
    removeTileset: tilesets.removeTileset,
    removeTilesetByUrl: tilesets.removeTilesetByUrl,
    tilesetLoading: tilesets.tilesetLoading,
    tilesetError: tilesets.tilesetError,
    clearTilesetError: tilesets.clearError,
    ...camera,
    realtimeLoading: realtime.loading,
    realtimeError: realtime.error,
    featureCount: realtime.featureCount,
    currentSourceId: realtime.currentSourceId,
    fetchData: realtime.fetchData,
    startPolling: realtime.startPolling,
    stopPolling: realtime.stopPolling,
    clear: realtime.clear,
    getEntityById: realtime.getEntityById,
  };
}