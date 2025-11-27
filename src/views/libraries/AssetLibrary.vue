<script setup lang="ts">
import LibraryBase from '@/components/LibraryBase.vue';
import AssetViewer from '@/components/AssetViewer.vue';
import UploadAsset from '@/components/UploadAsset.vue';
import type { Asset, LibraryItem } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface AssetItem extends LibraryItem {
  url: string;
  name: string;
  description?: string;
}

// ============================================================================
// Data Transformation
// ============================================================================

function transformAssetData(data: unknown[]): AssetItem[] {
  return (data as Asset[]).map((asset) => ({
    ...asset,
    name: asset.url.split('/').pop() ?? 'Unknown',
  }));
}

// ============================================================================
// Code Snippets
// ============================================================================

function getCesiumJsSnippet(asset: LibraryItem): string {
  return `
import { Viewer, Cartesian3, HeadingPitchRange, Math as CesiumMath } from 'cesium';
const viewer = new Viewer('cesiumContainer');
const position = Cartesian3.fromDegrees(4.3517, 50.8503, 0);
const entity = viewer.entities.add({
    position: position,
    model: {
        uri: '${asset.url}',
        minimumPixelSize: 128,
        maximumScale: 20000
    }
});
viewer.zoomTo(entity, new HeadingPitchRange(CesiumMath.toRadians(45), CesiumMath.toRadians(-30), 200));
`.trim();
}

function getCesiumUnitySnippet(asset: LibraryItem): string {
  return `
using UnityEngine;
using CesiumForUnity;
public class LoadGltfModel : MonoBehaviour
{
    void Start()
    {
        CesiumGltfModel gltfModel = this.gameObject.AddComponent<CesiumGltfModel>();
        gltfModel.url = "${asset.url}";
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
    title="Asset Library"
    itemType="asset"
    fetchUrl="/assets-manager"
    deleteUrlBase="/assets-manager/delete"
    :viewerComponent="AssetViewer"
    :uploadComponent="UploadAsset"
    :codeSnippets="codeSnippets"
    :transformData="transformAssetData"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <li
        v-for="item in items"
        :key="item.url"
        class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
        :class="{ 'bg-blue-50': selectedItem && selectedItem.url === item.url }"
        @click="selectItem(item)"
      >
        <div class="font-bold">{{ item.name }}</div>
        <button
          @click.stop="deleteItem(item)"
          class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </li>
    </template>
  </LibraryBase>
</template>
