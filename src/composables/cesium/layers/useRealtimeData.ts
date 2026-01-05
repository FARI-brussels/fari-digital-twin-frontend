import { ref, onUnmounted } from 'vue'
import type { CesiumViewerRef } from '@/types/Cesium'
import type { GeoJSONFeatureCollection } from '@/types'
import {
  GeoJsonDataSource,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  BillboardGraphics,
  VerticalOrigin,
  NearFarScalar,
} from 'cesium'
import { getLayerStyle } from '@/lib/layerStyles'
import { getPM25Value, getAirQualityColor, getTrafficColor } from '@/lib/layerStyles'
import { fetchMobilityData, MobilityEndpoints, type MobilitySource } from '@/api/mobilityClient'
import { apiClient } from '@/api'
import { ComponentEndpoints, type ComponentSource } from '@/api/queries/components'

interface RealtimeOptions {
  pollInterval?: number
  clampToGround?: boolean
  sourceId: string
}

interface RealtimeDataConfig {
  fetchFn?: () => Promise<GeoJSONFeatureCollection>
  options: RealtimeOptions
}

type SourceType = 'mobility' | 'component' | 'unknown'

class IconAtlasManager {
  private emojiCanvas: HTMLCanvasElement | null = null
  private circleCanvas: HTMLCanvasElement | null = null
  private emojiCache = new Map<string, string>()
  private sharedCircleUrl: string | null = null

  createEmojiIcon(emoji: string, size = 128): string {
    const key = `${emoji}:${size}`
    if (this.emojiCache.has(key)) return this.emojiCache.get(key)!

    if (!this.emojiCanvas) this.emojiCanvas = document.createElement('canvas')
    
    
    this.emojiCanvas.width = size
    this.emojiCanvas.height = size
    const ctx = this.emojiCanvas.getContext('2d', { willReadFrequently: false })
    if (!ctx) return ''

    ctx.clearRect(0, 0, size, size)
    ctx.font = `bold ${size * 0.78}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, size / 2, size / 2 + 4)

    const dataUrl = this.emojiCanvas.toDataURL()
    this.emojiCache.set(key, dataUrl)
    return dataUrl
  }

  createSharedCircle(radius = 14, strokeWidth = 4): string {
    if (this.sharedCircleUrl) return this.sharedCircleUrl

    if (!this.circleCanvas) this.circleCanvas = document.createElement('canvas')
    
    const size = (radius + strokeWidth) * 2
    this.circleCanvas.width = size
    this.circleCanvas.height = size
    
    const ctx = this.circleCanvas.getContext('2d', { 
      willReadFrequently: false,
      alpha: true 
    })

    if (!ctx) return ''

    ctx.clearRect(0, 0, size, size)
    
    const center = size / 2
    
    ctx.beginPath()
    ctx.arc(center, center, radius + strokeWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    this.sharedCircleUrl = this.circleCanvas.toDataURL()
    return this.sharedCircleUrl
  }

  clear() {
    this.emojiCache.clear()
    this.emojiCanvas = null
    this.circleCanvas = null
    this.sharedCircleUrl = null
  }
}

const iconAtlas = new IconAtlasManager()

export function useRealtimeData(viewerRef: CesiumViewerRef) {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const featureCount = ref(0)
  const currentSourceId = ref<string | null>(null)

  let dataSource: GeoJsonDataSource | null = null
  let pollInterval: number | null = null
  let cameraListener: (() => void) | null = null

  const getSourceType = (id: string): SourceType => {
    if (id in MobilityEndpoints) return 'mobility'
    if (id in ComponentEndpoints) return 'component'
    return 'unknown'
  }

  const normalizeGeoJSON = (data: GeoJSONFeatureCollection): GeoJSONFeatureCollection => ({
    ...data,
    features: data.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.coordinates.map((coord) =>
          typeof coord === 'string' ? parseFloat(coord) : coord
        ) as [number, number] | [number, number, number],
      },
    })),
  })

  const fetchRealtimeData = async (sourceId: string): Promise<GeoJSONFeatureCollection> => {
    const sourceType = getSourceType(sourceId)
    let response: GeoJSONFeatureCollection

    if (sourceType === 'mobility') {
      response = await fetchMobilityData(sourceId as MobilitySource)
    } else if (sourceType === 'component') {
      const endpoint = ComponentEndpoints[sourceId as ComponentSource]
      response = await apiClient.get(endpoint).json<GeoJSONFeatureCollection>()
    } else {
      throw new Error(`Unknown data source: ${sourceId}`)
    }

    return normalizeGeoJSON(response)
  }

  const styleEntities = (
    dataSource: GeoJsonDataSource,
    sourceId: string
  ): void => {
    const viewer = viewerRef.value
    if (!viewer) return

    const entities = dataSource.entities.values
    const style = getLayerStyle(sourceId)

    dataSource.entities.suspendEvents()

    let cachedWidth: number | null = null
    let lastCameraHeight: number | null = null

    const getPolylineWidth = (): number => {
      const currentHeight = viewer.camera.positionCartographic.height
      
      if (cachedWidth === null || lastCameraHeight === null || 
          Math.abs(currentHeight - lastCameraHeight) > 100) {
        lastCameraHeight = currentHeight

        if (currentHeight < 500) cachedWidth = 8
        else if (currentHeight < 2000) cachedWidth = 6
        else if (currentHeight < 10000) cachedWidth = 5
        else cachedWidth = 3
      }
      
      return cachedWidth
    }

    try {
      entities.forEach(entity => {
        const props = entity.properties?.getValue(viewer.clock.currentTime) ?? {}

        if (style.useIconLayer && style.iconEmoji) {
          const iconUrl = iconAtlas.createEmojiIcon(style.iconEmoji, 128)
          
          entity.billboard = new BillboardGraphics({
            image: iconUrl,
            width: style.iconSize || 40,
            height: style.iconSize || 40,
            verticalOrigin: VerticalOrigin.BOTTOM,
            scaleByDistance: new NearFarScalar(500, 1.2, 8000, 0.4),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          })
          entity.point = undefined
          return
        }

        if (entity.position) {
          let fillColor = Color.YELLOW.withAlpha(0.8)

          if (sourceId === 'sensorCommunity') {
            const pm25 = getPM25Value(props.sensordatavalues)
            const [r, g, b] = getAirQualityColor(pm25)

            fillColor = Color.fromBytes(r, g, b, 255)
          }
          else if (typeof style.getFillColor === 'function') {
            const arr = style.getFillColor({ properties: props })
            if (Array.isArray(arr)) {
              const [r, g, b, a = 230] = arr as [number, number, number, number?]
              fillColor = Color.fromBytes(r, g, b, a)
            }
          }
          else if (Array.isArray(style.getFillColor)) {
            const [r, g, b, a = 200] = style.getFillColor
            fillColor = Color.fromBytes(r, g, b, a)
          }

          const sharedCircle = iconAtlas.createSharedCircle(14, 4)

          entity.billboard = new BillboardGraphics({
            image: sharedCircle,
            width: 40,
            height: 40,
            color: fillColor,
            verticalOrigin: VerticalOrigin.BOTTOM,
            scaleByDistance: new NearFarScalar(500, 1.2, 10000, 0.5),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          })

          entity.point = undefined
          return
        }

        if (entity.polyline && sourceId === 'telraam') {
          const carCount = Number(props.car ?? 0)
          const [r, g, b] = getTrafficColor(carCount)
          entity.polyline.material = new ColorMaterialProperty(Color.fromBytes(r, g, b, 240))
          
          entity.polyline.width = new ConstantProperty(getPolylineWidth())
          
          return
        }

        if (entity.polygon) {
          const fill = style.getFillColor
            ? Array.isArray(style.getFillColor)
              ? style.getFillColor
              : typeof style.getFillColor === 'function'
                ? style.getFillColor({ properties: props })
                : [255, 255, 0, 80]
            : [255, 255, 0, 80]

          const fillArray = Array.isArray(fill) ? fill : [255, 255, 0, 80]
          const [r, g, b, a = 80] = fillArray as [number, number, number, number?]
          entity.polygon.material = new ColorMaterialProperty(Color.fromBytes(r, g, b, a))
          entity.polygon.outline = new ConstantProperty(true)
          entity.polygon.outlineColor = new ConstantProperty(Color.WHITE)
          entity.polygon.outlineWidth = new ConstantProperty(2)
        }
      })
    } finally {
      dataSource.entities.resumeEvents()
    }
  }

  const fetchData = async (config: RealtimeDataConfig): Promise<void> => {
    const viewer = viewerRef.value
    if (!viewer || viewer.isDestroyed()) return

    loading.value = true
    error.value = null

    try {
      let geoJson: GeoJSONFeatureCollection

      if (config.fetchFn) geoJson = await config.fetchFn()
      else geoJson = await fetchRealtimeData(config.options.sourceId)

      if (dataSource) {
        viewer.dataSources.remove(dataSource, true)
        dataSource = null
      }

      dataSource = await GeoJsonDataSource.load(geoJson, {
        clampToGround: config.options.clampToGround ?? true,
        markerColor: Color.TRANSPARENT,
        markerSize: 0,
        markerSymbol: '',
      })

      // use if slow:
      // dataSource.clustering.enabled = true
      // dataSource.clustering.pixelRange = 50

      styleEntities(dataSource, config.options.sourceId)

      viewer.dataSources.add(dataSource)
      featureCount.value = geoJson.features?.length || 0
      currentSourceId.value = config.options.sourceId

      setupCameraListener(config.options.sourceId)

      viewer.scene.requestRender()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[useRealtimeData]', err)
    } finally {
      loading.value = false
    }
  }

  const setupCameraListener = (sourceId: string) => {
    const viewer = viewerRef.value
    if (!viewer || !dataSource) return

    if (cameraListener) {
      cameraListener()
      cameraListener = null
    }

    if (sourceId !== 'telraam') return

    let lastUpdateHeight: number | null = null
    let updateTimer: number | null = null

    const updatePolylineWidths = () => {
      if (!dataSource || !viewer) return

      const currentHeight = viewer.camera.positionCartographic.height
      
      if (lastUpdateHeight === null || 
          Math.abs(currentHeight - lastUpdateHeight) / lastUpdateHeight > 0.1) {
        
        lastUpdateHeight = currentHeight

        let width: number
        if (currentHeight < 500) width = 8
        else if (currentHeight < 2000) width = 6
        else if (currentHeight < 10000) width = 5
        else width = 3

        dataSource.entities.suspendEvents()
        
        const entities = dataSource.entities.values
        entities.forEach(entity => {
          if (entity.polyline) {
            entity.polyline.width = new ConstantProperty(width)
          }
        })
        
        dataSource.entities.resumeEvents()
        viewer.scene.requestRender()
      }
    }

    const onCameraMove = () => {
      if (updateTimer) clearTimeout(updateTimer)
      updateTimer = window.setTimeout(updatePolylineWidths, 100)
    }

    viewer.camera.moveEnd.addEventListener(onCameraMove)

    cameraListener = () => {
      viewer.camera.moveEnd.removeEventListener(onCameraMove)
      if (updateTimer) clearTimeout(updateTimer)
    }
  }

  const startPolling = (config: RealtimeDataConfig) => {
    stopPolling()
    void fetchData(config)
    const interval = config.options?.pollInterval || 20000
    pollInterval = window.setInterval(() => fetchData(config), interval)
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  const clear = () => {
    const viewer = viewerRef.value
    if (viewer && dataSource) {
      viewer.dataSources.remove(dataSource, true)
      dataSource = null
      featureCount.value = 0
      currentSourceId.value = null
    }
    if (cameraListener) {
      cameraListener()
      cameraListener = null
    }
    stopPolling()
  }

  const getEntityById = (id: string) => dataSource?.entities.getById(id)

  onUnmounted(() => {
    clear()
    iconAtlas.clear()
  })

  return {
    loading,
    error,
    featureCount,
    currentSourceId,
    fetchData,
    startPolling,
    stopPolling,
    clear,
    getEntityById,
  }
}