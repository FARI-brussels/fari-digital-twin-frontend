import { apiClient } from '@/lib/http'

export interface AssetSummary {
  id: string
  name: string
  url: string
  createdAt?: string
}

export async function listAssets(): Promise<AssetSummary[]> {
  const { data } = await apiClient.get('/assets')
  return data
}

export async function uploadAsset(form: FormData): Promise<void> {
  await apiClient.post('/assets', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteAssetByUrl(url: string): Promise<void> {
  const endpoint = `/assets?url=${encodeURIComponent(url)}`
  await apiClient.delete(endpoint)
}
