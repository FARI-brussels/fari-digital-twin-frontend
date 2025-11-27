import { ref, onBeforeUnmount, type Ref } from 'vue';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { InterpolatedVehicle } from '@/types/vehicle';

/**
 * Initial view state interface
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

/**
 * Return type for useMapViewer composable
 */
interface UseMapViewerReturn {
  error: Ref<string | null>;
  initializeMap: (
    mapContainer: HTMLElement,
    deckCanvas: HTMLCanvasElement,
    onMapReady?: () => void
  ) => void;
  updateLayers: (vehicleData: InterpolatedVehicle[]) => void;
  cleanup: () => void;
}

/**
 * Composable for map and Deck.gl visualization
 * Single Responsibility: Manages map initialization, layers, and rendering
 */
export function useMapViewer(initialViewState: ViewState): UseMapViewerReturn {
  const error = ref<string | null>(null);

  let map: Map | null = null;
  let deck: Deck | null = null;

  /**
   * Initialize the map and Deck.gl overlay
   * @param {HTMLElement} mapContainer - Container element for MapLibre
   * @param {HTMLCanvasElement} deckCanvas - Canvas element for Deck.gl
   * @param {Function} onMapReady - Callback when map is ready
   */
  function initializeMap(
    mapContainer: HTMLElement,
    deckCanvas: HTMLCanvasElement,
    onMapReady?: () => void
  ): void {
    if (!mapContainer || !deckCanvas) {
      return;
    }

    try {
      // Initialize MapLibre map
      map = new Map({
        container: mapContainer,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [initialViewState.longitude, initialViewState.latitude],
        zoom: initialViewState.zoom,
        interactive: false // Deck.gl handles interactions
      });

      // Initialize Deck.gl
      deck = new Deck({
        canvas: deckCanvas,
        width: '100%',
        height: '100%',
        initialViewState,
        controller: true,
        useDevicePixels: true,
        onViewStateChange: ({ viewState }) => {
          if (map) {
            map.jumpTo({
              center: [viewState.longitude, viewState.latitude],
              zoom: viewState.zoom,
              bearing: viewState.bearing,
              pitch: viewState.pitch
            });
          }
        },
        layers: []
      });

      // Notify when map is ready
      map.on('load', () => {
        if (onMapReady) {
          onMapReady();
        }
      });

    } catch (err) {
      console.error('❌ Error initializing map:', err);
      error.value = 'Failed to initialize map viewer';
    }
  }

  /**
   * Update visualization layers with vehicle data
   * Open/Closed Principle: Easy to add new layer types
   * @param {InterpolatedVehicle[]} vehicleData - Array of interpolated vehicle positions
   */
  function updateLayers(vehicleData: InterpolatedVehicle[]): void {
    if (!deck) return;

    const layers = [
      new ScatterplotLayer<InterpolatedVehicle>({
        id: 'vehicle-points',
        data: vehicleData,
        getPosition: (d: InterpolatedVehicle) => [d.longitude, d.latitude],
        getFillColor: (d: InterpolatedVehicle) => d.color,
        getRadius: 10,
        radiusMinPixels: 8,
        radiusMaxPixels: 16,
        lineWidthMinPixels: 2,
        getLineColor: [255, 255, 255],
        stroked: true,
        filled: true,
        pickable: true,
        autoHighlight: true
      }),
      new TextLayer<InterpolatedVehicle>({
        id: 'vehicle-labels',
        data: vehicleData.filter(d => d.routeId),
        getPosition: (d: InterpolatedVehicle) => [d.longitude, d.latitude],
        getText: (d: InterpolatedVehicle) => d.routeId || '',
        getSize: 12,
        getColor: [255, 255, 255],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: [0, 0, 0, 180],
        backgroundPadding: [2, 1]
      })
    ];

    deck.setProps({ layers });
  }

  /**
   * Clean up map resources
   */
  function cleanup(): void {
    if (deck) {
      deck.finalize();
    }
    if (map) {
      map.remove();
    }
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanup();
  });

  return {
    error,
    initializeMap,
    updateLayers,
    cleanup
  };
}
