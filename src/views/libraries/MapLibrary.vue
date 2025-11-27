<script setup lang="ts">
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import MapViewer from '@/components/MapViewer.vue';
import UploadMapLayer from '@/components/UploadMapLayer.vue';
import { useMapLayersQuery, useDeleteMapLayerMutation } from '@/api';
import type { MapLayer, LibraryItem, GroupedLayers } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface MapLayerItem extends LibraryItem {
  url: string;
  layer: string;
  description: string;
}

// ============================================================================
// Query & Mutations
// ============================================================================

const { data: rawMapLayers, isLoading, error, refetch } = useMapLayersQuery();
const deleteMapLayerMutation = useDeleteMapLayerMutation();

// ============================================================================
// Computed
// ============================================================================

const mapLayers = computed<MapLayerItem[]>(() => {
  if (!rawMapLayers.value) return [];
  return rawMapLayers.value as MapLayerItem[];
});

// ============================================================================
// Helper Functions
// ============================================================================

function groupedLayers(layers: LibraryItem[]): GroupedLayers {
  if (!Array.isArray(layers)) return {};
  return (layers as MapLayerItem[]).reduce<GroupedLayers>((acc, layer) => {
    const provider = layer.url;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(layer as MapLayer);
    return acc;
  }, {});
}

// ============================================================================
// Handlers
// ============================================================================

async function handleDelete(item: LibraryItem): Promise<void> {
  const mapLayer = item as MapLayerItem;
  await deleteMapLayerMutation.mutateAsync({
    url: mapLayer.url,
    layer: mapLayer.layer,
  });
}

function handleUploaded(): void {
  void refetch();
}

// ============================================================================
// Code Snippets
// ============================================================================

function getCesiumJsSnippet(layer: LibraryItem): string {
  const mapLayer = layer as MapLayerItem;
  return `
import { Viewer, WebMapServiceImageryProvider } from 'cesium';
const viewer = new Viewer('cesiumContainer');
const wmsProvider = new WebMapServiceImageryProvider({
    url: '${mapLayer.url}',
    layers: '${mapLayer.layer}',
    parameters: {
        transparent: true,
        format: 'image/png'
    }
});
viewer.imageryLayers.addImageryProvider(wmsProvider);
`.trim();
}

function getCesiumUnitySnippet(layer: LibraryItem): string {
  const mapLayer = layer as MapLayerItem;
  return `
using UnityEngine;
using CesiumForUnity;
public class AddWmsLayer : MonoBehaviour
{
    void Start()
    {
        CesiumWebMapServiceRasterOverlay wmsOverlay = this.gameObject.AddComponent<CesiumWebMapServiceRasterOverlay>();
        wmsOverlay.baseUrl = "${mapLayer.url}";
        wmsOverlay.layers = "${mapLayer.layer}";
    }
}
`.trim();
}

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>

<template>
  <LibraryBase
    title="Map Layer Library"
    itemType="map"
    :viewerComponent="MapViewer"
    :uploadComponent="UploadMapLayer"
    :codeSnippets="codeSnippets"
    :items="mapLayers"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <div v-for="(layers, provider) in groupedLayers(items)" :key="provider" class="mb-5">
        <h2 class="text-lg font-bold bg-gray-100 px-4 py-2 border-b">{{ provider }}</h2>
        <ul>
          <li
            v-for="layer in layers"
            :key="layer.layer"
            class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
            :class="{
              'bg-blue-50':
                selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url,
            }"
            @click="selectItem(layer)"
          >
            <div class="font-bold">{{ layer.description }}</div>
            <button
              @click.stop="deleteItem(layer)"
              class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </li>
        </ul>
      </div>
    </template>
  </LibraryBase>
</template>
