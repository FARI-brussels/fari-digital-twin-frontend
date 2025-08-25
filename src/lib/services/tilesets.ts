import { apiClient } from '@/lib/http'

export interface TilesetSummary {
  id?: string
  name: string
  url: string
}

export async function listTilesets(): Promise<TilesetSummary[]> {
  const { data } = await apiClient.get('/tilesets')
  return data
}

export async function uploadTileset(form: FormData): Promise<void> {
  await apiClient.post('/tilesets', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteTilesetByUrl(url: string): Promise<void> {
  const endpoint = `/tilesets?url=${encodeURIComponent(url)}`
  await apiClient.delete(endpoint)
}
