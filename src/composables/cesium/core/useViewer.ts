import { ref, onMounted, onBeforeUnmount, shallowRef,markRaw } from 'vue'
import {
  Viewer,
  EllipsoidTerrainProvider,
  createWorldTerrainAsync,
  createOsmBuildingsAsync,
  OpenStreetMapImageryProvider,
  Ion,
  RequestScheduler,
  Math as CesiumMath,
  Cartesian3,
  ShadowMode,
  CesiumTerrainProvider,
  IonResource
} from 'cesium'
import type { CesiumViewerOptions, CesiumViewState } from '@/types/Cesium'
import { useCesiumAssetCache } from '@/stores/cesiumAssetCache'


const DEFAULT_VIEW_STATE: CesiumViewState = {
  longitude: 4.3517,
  latitude: 50.8503,
  altitude: 1000,
  pitch: -32,
  bearing: 0,
}

const DEFAULT_CUSTOM_TERRAIN_ASSET_ID = 3340034

export function useViewer(options: CesiumViewerOptions) {
  const {
    container,
    initialViewState = {},
    enableCesiumTerrain = false,
    enableCustomTerrain = false,
    customTerrainAssetId = DEFAULT_CUSTOM_TERRAIN_ASSET_ID,
    enableOSMBuildings = false,
  } = options

  const viewer = shallowRef<Viewer | null>(null)
  const cache = useCesiumAssetCache()
  const ready = ref(false)
  const loading = ref(false)
  const error = ref<unknown | null>(null)

  if (import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN) 
    Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN

  const initialize = async () => {
    if (!container.value || viewer.value) return

    try {
      loading.value = true

      RequestScheduler.requestsByServer['tile.openstreetmap.org:443'] = 6
      RequestScheduler.throttleRequests = true

      viewer.value = markRaw(new Viewer(container.value, {
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        shadows: false,
        // geocoder: import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN,
        terrainShadows: ShadowMode.DISABLED,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        homeButton: false,
        navigationHelpButton: false,
        baseLayerPicker: false,
        geocoder: false,
        sceneModePicker: false,
        infoBox: true,
        terrainProvider: new EllipsoidTerrainProvider(),
        selectionIndicator: true,
        terrain: undefined, //for later
      }))

      viewer.value.scene.globe.maximumScreenSpaceError = 4
      viewer.value.scene.requestRenderMode = true
      viewer.value.scene.maximumRenderTimeChange = Infinity
      viewer.value.scene.screenSpaceCameraController.minimumZoomDistance = 50 
      viewer.value.scene.screenSpaceCameraController.maximumZoomDistance = 10_000_000

      const osm = new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
        maximumLevel: 19,
      })
      
      viewer.value.imageryLayers.removeAll()
      viewer.value.imageryLayers.addImageryProvider(osm)

      if (enableCesiumTerrain) {
        const terrain = await createWorldTerrainAsync()
        viewer.value.terrainProvider = terrain
        viewer.value.scene.globe.depthTestAgainstTerrain = true
      } else if (enableCustomTerrain) {
        const terrainResource = await IonResource.fromAssetId(customTerrainAssetId)
        const terrain = await CesiumTerrainProvider.fromUrl(terrainResource)
        viewer.value.terrainProvider = terrain
        viewer.value.scene.globe.depthTestAgainstTerrain = true
      }

      if (enableOSMBuildings) {
        const buildings = await createOsmBuildingsAsync()
        viewer.value.scene.primitives.add(buildings)
      }

      const scene = viewer.value.scene
      scene.globe.enableLighting = false
      scene.highDynamicRange = true
      scene.postProcessStages.fxaa.enabled = true
      scene.screenSpaceCameraController.enableCollisionDetection = false
      const view = { ...DEFAULT_VIEW_STATE, ...initialViewState }

      const destination = Cartesian3.fromDegrees(
        view.longitude,
        view.latitude,
        view.altitude
      )

      viewer.value.camera.setView({
        destination,
        orientation: {
          heading: view.bearing && CesiumMath.toRadians(view.bearing),
          pitch: view.pitch && CesiumMath.toRadians(view.pitch),
          roll: 0,
        },
      })

      requestAnimationFrame(() => 
        viewer.value && viewer.value.scene.requestRender()
      )

      ready.value = true
    } catch (err: unknown) {
      error.value = err || 'Failed to initialize Cesium'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const setBasemap = (type: 'osm' | 'none' | null = 'osm') => {
    if (!viewer.value) return
  
    const imageryLayers = viewer.value.imageryLayers
  
    imageryLayers.removeAll()
  
    if (type === 'none') return
    
    if (type === 'osm') {
      const osm = new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors',
      })
      const layer = imageryLayers.addImageryProvider(osm)
      layer.alpha = 0.95
      imageryLayers.lowerToBottom(layer)
      return
    }
  
    if (type) {
      const layer = imageryLayers.addImageryProvider(type)
      imageryLayers.lowerToBottom(layer)
    }
  }

  const destroy = () => {
    if (viewer.value && !viewer.value.isDestroyed()) 
      viewer.value.destroy()
    cache.clearAll()


    viewer.value = null
    ready.value = false
  }

  onMounted(initialize)
  onBeforeUnmount(destroy)

  return {
    viewer,
    ready,
    loading,
    error,
    destroy,
    setBasemap,
  }
}