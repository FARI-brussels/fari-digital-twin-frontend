import {  ImageryLayer } from 'cesium'
import { useCesiumAssetCache } from '@/stores/cesiumAssetCache'
import type { WMSOptions, CesiumViewerRef } from '@/types/Cesium'

export function useWMS(viewerRef: CesiumViewerRef) {
  const cacheStore = useCesiumAssetCache()
  const activeLayers = new Set<ImageryLayer>()

  const addWMSLayer = (
    url: string,
    layers: string,
    options: WMSOptions = {},
  ): ImageryLayer | null => {
    const v = viewerRef.value
    if (!v) return null

    const provider = cacheStore.getOrCreateWMSProvider(url, layers, options.parameters)
    const layer = v.imageryLayers.addImageryProvider(provider)

    layer.alpha = options.opacity ?? 1.0
    layer.brightness = options.brightness ?? 1.0
    layer.contrast = options.contrast ?? 1.0

    activeLayers.add(layer)
    v.scene.requestRender()

    return layer
  }

  const removeWMSLayer = (layer: ImageryLayer) => {
    const v = viewerRef.value
    if (v && activeLayers.has(layer)) {
      v.imageryLayers.remove(layer, false)
      activeLayers.delete(layer)
      v.scene.requestRender()
    }
  }

  const clearAll = () => {
    const v = viewerRef.value
    if (!v) return
    activeLayers.forEach(l => v.imageryLayers.remove(l, false))
    activeLayers.clear()
    v.scene.requestRender()
  }

  return { addWMSLayer, removeWMSLayer, clearAll }
}