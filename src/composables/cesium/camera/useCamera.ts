import { ref } from 'vue';
import { 
  Cartesian3, 
  Matrix4, 
  Math as CesiumMath, 
  HeadingPitchRange,
} from 'cesium';
import type { CesiumViewState, CesiumViewerRef } from '@/types/Cesium';

const DEFAULT_VIEW: CesiumViewState = {
  longitude: 4.3517,
  latitude: 50.8503,
  altitude: 4000,
  pitch: -45,
  bearing: 0,
};

export function useCamera(viewerRef: CesiumViewerRef) {
  // Track current heading for rotation controls
  const currentHeading = ref<number | undefined>(0);
  const initialViewState = ref<CesiumViewState>(DEFAULT_VIEW);

  /**
   * Store the initial view state for reset functionality
   */
  const setInitialViewState = (state: Partial<CesiumViewState>) => {
    initialViewState.value = { ...DEFAULT_VIEW, ...state };
    currentHeading.value = initialViewState.value.bearing;
  };

  /**
   * Set camera view immediately (no animation)
   */
  const setView = (state: Partial<CesiumViewState> = {}) => {
    const v = viewerRef.value;
    if (!v) return;
    
    const view = { ...DEFAULT_VIEW, ...state };
    currentHeading.value = view.bearing;

    const destination = Cartesian3.fromDegrees(view.longitude, view.latitude, view.altitude);

    v.camera.setView({
      destination,
      orientation: {
        heading: view.bearing && CesiumMath.toRadians(view.bearing),
        pitch: view.pitch && CesiumMath.toRadians(view.pitch),
        roll: 0,
      },
    });

    v.scene.requestRender();
  };

  /**
   * Fly camera to a new position with animation
   */
  const flyTo = (state: Partial<CesiumViewState>, duration = 2) => {
    const v = viewerRef.value;
    if (!v) return;

    const view = { ...DEFAULT_VIEW, ...state };
    currentHeading.value = view.bearing;
    const destination = Cartesian3.fromDegrees(view.longitude, view.latitude, view.altitude);

    v.camera.flyTo({
      destination,
      duration,
      orientation: {
        heading: view.bearing &&  CesiumMath.toRadians(view.bearing),
        pitch: view.pitch && CesiumMath.toRadians(view.pitch),
        roll: 0,
      },
    });
  };

  /**
   * Look at a specific model/position
   */
  const lookAtModel = (position: Cartesian3, distance = 80, pitch = -30) => {
    const v = viewerRef.value;
    if (!v) return;

    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error('Invalid position for lookAtModel:', position);
      return;
    }

    v.camera.lookAt(
      position,
      new HeadingPitchRange(
        CesiumMath.toRadians(currentHeading.value ?? 0),
        CesiumMath.toRadians(pitch ?? 0),
        distance ?? 0
      )
    );

    v.camera.lookAtTransform(Matrix4.IDENTITY);
  };

  /**
   * Zoom in by a factor (default 30% closer)
   */
  const zoomIn = (factor = 0.3) => {
    const v = viewerRef.value;
    if (!v?.camera) return;

    const height = v.camera.positionCartographic.height;
    v.camera.zoomIn(height * factor);
  };

  /**
   * Zoom out by a factor (default 30% further)
   */
  const zoomOut = (factor = 0.3) => {
    const v = viewerRef.value;
    if (!v?.camera) return;

    const height = v.camera.positionCartographic.height;
    v.camera.zoomOut(height * factor);
  };

  /**
   * Rotate camera left by degrees
   */
  const rotateLeft = (degrees = 45, animate = true) => {
    const v = viewerRef.value;
    if (!v?.camera) return;

    currentHeading.value = currentHeading.value 
    ? currentHeading.value - degrees 
    : currentHeading.value;

    if (animate) {
      v.camera.flyTo({
        destination: v.camera.position,
        orientation: {
          heading: CesiumMath.toRadians(currentHeading.value ?? 0),
          pitch: v.camera.pitch,
          roll: 0,
        },
        duration: 0.5,
      });
    } else {
      v.camera.setView({
        destination: v.camera.position,
        orientation: {
          heading: CesiumMath.toRadians(currentHeading.value ?? 0),
          pitch: v.camera.pitch,
          roll: 0,
        },
      });
    }
  };

  /**
   * Rotate camera right by degrees
   */
  const rotateRight = (degrees = 45, animate = true) => {
    const v = viewerRef.value;
    if (!v?.camera) return;

    currentHeading.value = (currentHeading.value ?? 0) + degrees;

    if (animate) {
      v.camera.flyTo({
        destination: v.camera.position,
        orientation: {
          heading: CesiumMath.toRadians(currentHeading.value ?? 0),
          pitch: v.camera.pitch,
          roll: 0,
        },
        duration: 0.5,
      });
    } else {
      v.camera.setView({
        destination: v.camera.position,
        orientation: {
          heading: CesiumMath.toRadians(currentHeading.value ?? 0),
          pitch: v.camera.pitch,
          roll: 0,
        },
      });
    }
  };

  /**
   * Reset camera to initial view state
   */
  const resetView = (duration = 1.5) => {
    const v = viewerRef.value;
    if (!v) return;

    currentHeading.value = initialViewState.value.bearing;

    const destination = Cartesian3.fromDegrees(
      initialViewState.value.longitude,
      initialViewState.value.latitude,
      initialViewState.value.altitude
    );

    v.camera.flyTo({
      destination,
      duration,
      orientation: {
        heading: CesiumMath.toRadians(initialViewState.value.bearing ?? 0),
        pitch: CesiumMath.toRadians(initialViewState.value.pitch ?? 0),
        roll: 0,
      },
    });
  };

  /**
   * Enable/configure mouse and touch controls
   * Cesium supports these by default, but this ensures they're properly configured
   */
  const configureControls = (options: {
    enableRotate?: boolean;
    enableZoom?: boolean;
    enableTilt?: boolean;
    enableLook?: boolean;
  } = {}) => {
    const v = viewerRef.value;
    if (!v) return;

    const {
      enableRotate = true,
      enableZoom = true,
      enableTilt = true,
      enableLook = true,
    } = options;

    const controller = v.scene.screenSpaceCameraController;

    // Enable/disable rotation (middle mouse button or two-finger rotate on trackpad)
    controller.enableRotate = enableRotate;

    // Enable/disable zoom (scroll wheel or pinch on trackpad)
    controller.enableZoom = enableZoom;

    // Enable/disable tilt (middle mouse + ctrl or two-finger drag up/down)
    controller.enableTilt = enableTilt;

    // Enable/disable free look (right mouse button)
    controller.enableLook = enableLook;

    // Make rotation smoother
    controller.inertiaSpin = 0.9;
    controller.inertiaTranslate = 0.9;
    controller.inertiaZoom = 0.8;

    // Minimum and maximum zoom distances
    controller.minimumZoomDistance = 10;
    controller.maximumZoomDistance = 50000000;
  };

  /**
   * Get current camera state
   */
  const getCameraState = (): CesiumViewState | null => {
    const v = viewerRef.value;
    if (!v?.camera) return null;

    const cartographic = v.camera.positionCartographic;

    return {
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      altitude: cartographic.height,
      pitch: CesiumMath.toDegrees(v.camera.pitch),
      bearing: CesiumMath.toDegrees(v.camera.heading) ?? 0,
    };
  };

  /**
   * Sync internal heading state with actual camera heading
   * Useful after user manually rotates with mouse/trackpad
   */
  const syncHeading = () => {
    const v = viewerRef.value;
    if (!v?.camera) return;

    if(v.camera.heading) currentHeading.value =  CesiumMath.toDegrees(v.camera.heading);
  };

  return {
    // State
    currentHeading,
    initialViewState,

    // Core camera functions
    setView,
    flyTo,
    lookAtModel,
    setInitialViewState,
    getCameraState,

    // Control functions
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    resetView,

    // Configuration
    configureControls,
    syncHeading,
  };
}