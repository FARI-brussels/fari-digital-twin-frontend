import { Entity, Cartesian3, Transforms, Math as CesiumMath, HeadingPitchRoll } from 'cesium'
import { markRaw } from 'vue'
import { useCesiumAssetCache } from '@/stores/cesiumAssetCache'
import { hashModel } from '@/composables/cesium/utils/hash'
import type { CesiumViewerRef } from '@/types/Cesium'

export function use3DModels(viewerRef: CesiumViewerRef) {
  const cacheStore = useCesiumAssetCache()
  const entityCache = new Map<string, Entity>()

  const add3DModel = async (
    url: string,
    position: [number, number, number],
    options: {
      scale?: number
      rotation?: [number, number, number]
      minimumPixelSize?: number
      maximumScale?: number
    } = {}
  ): Promise<Entity> => {
    const v = viewerRef.value
    if (!v || v.isDestroyed()) throw new Error('Viewer not ready')

    const key = hashModel(url, position, options)
    if (entityCache.has(key)) {
      const cached = entityCache.get(key)!
      cached.show = true
      v.scene.requestRender()
      return cached
    }

    await cacheStore.preloadModel(url)

    const posCart = Cartesian3.fromDegrees(...position)

    const entity = v.entities.add({
      position: posCart,
      orientation: Transforms.headingPitchRollQuaternion(
        posCart,
        new HeadingPitchRoll(
          CesiumMath.toRadians(options.rotation?.[2] ?? 0),
          CesiumMath.toRadians(options.rotation?.[1] ?? 0),
          CesiumMath.toRadians(options.rotation?.[0] ?? 0)
        )
      ),
      model: {
        uri: url,
        scale: options.scale ?? 1,
        minimumPixelSize: options.minimumPixelSize ?? 64,
        maximumScale: options.maximumScale,
      },
    })

    const rawEntity = markRaw(entity)
    entityCache.set(key, rawEntity)

    v.scene.requestRender()
    return rawEntity
  }

  const removeModel = (entity: Entity) => {
    const v = viewerRef.value
    if (!v || v.isDestroyed()) return
    const success = v.entities.remove(entity)
    if (success) {

      for (const [key, cached] of entityCache.entries()) {
        if (cached === entity) {
          entityCache.delete(key)
          break
        }
      }
      v.scene.requestRender()
    }
  }

  const removeAllModels = () => {
    const v = viewerRef.value
    if (!v || v.isDestroyed()) return

    for (const entity of entityCache.values()) {
      v.entities.remove(entity)
    }
    entityCache.clear()
    v.scene.requestRender()
  }

  return { add3DModel, removeModel, removeAllModels }
}