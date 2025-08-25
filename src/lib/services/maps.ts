import { apiClient } from '@/lib/http'

export interface MapLayerSummary {
  id?: string
  name: string
  url: string
  layer: string
}

export async function listMapLayers(): Promise<MapLayerSummary[]> {
  const { data } = await apiClient.get('/maps')
  return data
}

export async function createMapLayer(payload: { url: string; layer: string; name?: string }) {
  const { data } = await apiClient.post('/maps', payload)
  return data
}

export async function deleteMapLayerByUrlAndName(url: string, layer: string): Promise<void> {
  const endpoint = `/maps?url=${encodeURIComponent(url)}&layer=${encodeURIComponent(layer)}`
  await apiClient.delete(endpoint)
}
