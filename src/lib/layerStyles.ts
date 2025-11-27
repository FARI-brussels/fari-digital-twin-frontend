// Types for our style configuration
export interface LegendItem {
  color: string;
  label: string;
}

export interface LayerStyleConfig {
  // Props specific to GeoJsonLayer
  pointType?: 'circle' | 'icon' | 'text';
  
  // Accessors - using simpler types to avoid complex DeckGL typings issues
  getFillColor?: unknown;
  getLineColor?: unknown;
  getLineWidth?: unknown;
  getPointRadius?: unknown;
  
  // Icon specific (for IconLayer)
  useIconLayer?: boolean;
  iconEmoji?: string;
  iconSize?: number;
  iconColor?: [number, number, number];
  
  // Legacy icon props (unused now)
  getIcon?: unknown;
  iconAtlas?: string;
  iconMapping?: unknown;
  
  // Legend
  legend?: {
    title: string;
    items: LegendItem[];
  };
}

// Helper for Telraam color scale
function getTrafficColor(carCount: number): [number, number, number] {
  if (carCount > 500) return [255, 0, 0]; // High traffic - Red
  if (carCount > 100) return [255, 165, 0]; // Medium - Orange
  return [0, 255, 0]; // Low - Green
}

export const LAYER_STYLES: Record<string, LayerStyleConfig> = {
  stib: {
    useIconLayer: true,
    iconEmoji: '🚌',
    iconSize: 40,
    iconColor: [181, 55, 140],
    legend: {
      title: 'STIB Vehicles',
      items: [{ color: '#B5378C', label: '🚌 Bus/Tram' }]
    }
  },
  sncb: {
    useIconLayer: true,
    iconEmoji: '🚆',
    iconSize: 45,
    iconColor: [0, 100, 0],
    legend: {
      title: 'SNCB Trains',
      items: [{ color: '#006400', label: '🚆 Train' }]
    }
  },
  bolt: {
    useIconLayer: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [50, 205, 50],
    legend: {
      title: 'Bolt',
      items: [{ color: '#32CD32', label: '🛴 Scooter' }]
    }
  },
  dott: {
    useIconLayer: true,
    iconEmoji: '🛴',
    iconSize: 35,
    iconColor: [0, 0, 255],
    legend: {
      title: 'Dott',
      items: [{ color: '#0000FF', label: '🛴 Scooter' }]
    }
  },
  telraam: {
    getLineColor: (d: { properties?: { car?: number } }) => {
      const count = d.properties?.car || 0;
      return getTrafficColor(count);
    },
    getLineWidth: () => 20,
    legend: {
      title: 'Traffic Density (Cars/Hour)',
      items: [
        { color: '#00FF00', label: 'Low (< 100)' },
        { color: '#FFA500', label: 'Medium (100-500)' },
        { color: '#FF0000', label: 'High (> 500)' }
      ]
    }
  },
  // Fallback for others
  default: {
    pointType: 'circle',
    getFillColor: () => [128, 128, 128, 200],
    getPointRadius: () => 8,
    getLineWidth: () => 2,
    getLineColor: () => [255, 255, 255],
    legend: {
      title: 'Data',
      items: [{ color: '#808080', label: 'Point' }]
    }
  }
};

export function getLayerStyle(source: string): LayerStyleConfig {
  return LAYER_STYLES[source] ?? LAYER_STYLES.default ?? {};
}

