import type { ShallowRef } from 'vue'
import type { Viewer } from 'cesium'
import { GeoJsonDataSource } from 'cesium'

export function useGeoJson(viewerRef: ShallowRef<Viewer | null>) {
  const addGeoJson = async (
    data: any,
    options: {
      stroke?: string
      strokeWidth?: number
      fill?: string
      clampToGround?: boolean
    } = {}
  ): Promise<GeoJsonDataSource | null> => {
    const v = viewerRef.value
    if (!v || v.isDestroyed()) return null

    try {
      const dataSource = await GeoJsonDataSource.load(data, {
        stroke: options.stroke ? Color.fromCssColorString(options.stroke) : Color.YELLOW,
        strokeWidth: options.strokeWidth ?? 3,
        fill: options.fill ? Color.fromCssColorString(options.fill) : Color.YELLOW.withAlpha(0.3),
        clampToGround: options.clampToGround ?? true,
      })

      v.dataSources.add(dataSource)
      v.scene.requestRender()

      return dataSource
    } catch (err) {
      console.error('Failed to load GeoJSON:', err)
      return null
    }
  }

  const removeDataSource = (dataSource: GeoJsonDataSource) => {
    const v = viewerRef.value
    if (v && v.dataSources.contains(dataSource)) {
      v.dataSources.remove(dataSource, true)
      v.scene.requestRender()
    }
  }

  return { addGeoJson, removeDataSource }
}