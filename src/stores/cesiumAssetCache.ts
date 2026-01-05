import { defineStore } from 'pinia'
import {
  Resource,
  WebMapServiceImageryProvider,
  Cesium3DTileset,
} from 'cesium'

export const useCesiumAssetCache = defineStore('cesiumAssetCache', () => {

  const modelPreloads = new Map<string, Promise<void>>()

  const preloadModel = async (url: string): Promise<void> => {
    const existing = modelPreloads.get(url)
    if (existing) return existing

    if (!Resource || !Resource.fetchArrayBuffer) {
      throw new Error('Cesium Resource.fetchArrayBuffer is not available')
    }

    // Type assertion needed because Resource might be undefined at type-check time
    const resource = Resource as NonNullable<typeof Resource>
    const urlParam = { url } as { url: string }
    const arrayBufferPromise = resource.fetchArrayBuffer(urlParam)
    
    if (!arrayBufferPromise) {
      throw new Error('Failed to initiate fetch for model')
    }
    
    const promise = arrayBufferPromise
      .then(() => {
        // Convert Promise<ArrayBuffer> to Promise<void> - result is not needed
        return undefined
      })
      .catch((err) => {
        modelPreloads.delete(url)
        console.error('[CesiumCache] Failed to preload model:', url, err)
        throw err
      })

    modelPreloads.set(url, promise)
    return promise
  }

  const wmsProviders = new Map<string, WebMapServiceImageryProvider>()

  const hashWMS = (
    url: string,
    layers: string,
    parameters: Record<string, any> = {}
  ): string => {
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce((obj, key) => {
        obj[key] = parameters[key]
        return obj
      }, {} as Record<string, any>)

    return `${url}|${layers}|${JSON.stringify(sortedParams)}`
  }

  const getOrCreateWMSProvider = (
    url: string,
    layers: string,
    userParameters: Record<string, any> = {}
  ): WebMapServiceImageryProvider => {
    const key = hashWMS(url, layers, {
      transparent: true,
      format: 'image/png',
      ...userParameters,
    })

    if (!wmsProviders.has(key)) {
      const provider = new WebMapServiceImageryProvider({
        url,
        layers,
        parameters: {
          transparent: true,
          format: 'image/png',
          ...userParameters,
        },
      })

      wmsProviders.set(key, provider)
    }

    return wmsProviders.get(key)!
  }

  const tilesetInstances = new Map<string, Cesium3DTileset>()

  const cacheTileset = (url: string, tileset: Cesium3DTileset): void => {
    if (!tilesetInstances.has(url)) tilesetInstances.set(url, tileset)
  }

  const getCachedTileset = (url: string): Cesium3DTileset | undefined => tilesetInstances.get(url)

  const removeTileset = (url: string): void => {
    // Only remove from cache — DO NOT DESTROY
    // Cesium will destroy it when viewer is destroyed
    tilesetInstances.delete(url)
  }

  const clearAll = (): void => {
    modelPreloads.clear()

    wmsProviders.clear()

    tilesetInstances.forEach((tileset) => {
      if (!tileset.isDestroyed()) tileset.destroy()
    })
    tilesetInstances.clear()
  }

  return {
    // Model
    preloadModel,

    // WMS
    getOrCreateWMSProvider,

    // Tilesets
    cacheTileset,
    getCachedTileset,
    removeTileset,

    // Debug / HMR
    clearAll,
  }
})