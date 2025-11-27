<script setup lang="ts">
/**
 * AssetLibrary - Browse and manage 3D assets
 * Delete button only shown when authenticated
 */
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import AssetViewer from '@/components/AssetViewer.vue';
import UploadAsset from '@/components/UploadAsset.vue';
import { Button } from '@/components/ui/button';
import { useAssetsQuery, useDeleteAssetMutation } from '@/api';
import type { Asset, LibraryItem } from '@/types';
import { Trash2, Box } from 'lucide-vue-next';

// ============================================================================
// Types
// ============================================================================

interface AssetItem extends LibraryItem {
  url: string;
  name: string;
  description?: string;
}

// ============================================================================
// Query & Mutations
// ============================================================================

const { data: rawAssets, isLoading, error, refetch } = useAssetsQuery();
const deleteAssetMutation = useDeleteAssetMutation();

// ============================================================================
// Computed
// ============================================================================

const assets = computed<AssetItem[]>(() => {
  if (!rawAssets.value) return [];
  return rawAssets.value.map((asset: Asset) => ({
    ...asset,
    name: asset.url.split('/').pop() ?? 'Unknown',
  }));
});

// ============================================================================
// Handlers
// ============================================================================

async function handleDelete(item: LibraryItem): Promise<void> {
  if (!item.url) throw new Error('Asset has no URL');
  await deleteAssetMutation.mutateAsync(item.url);
}

function handleUploaded(): void {
  void refetch();
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
    :viewerComponent="AssetViewer"
    :uploadComponent="UploadAsset"
    :codeSnippets="codeSnippets"
    :items="assets"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li
        v-for="item in items"
        :key="item.url"
        class="group flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors"
        :class="[
          selectedItem && selectedItem.url === item.url
            ? 'bg-primary/10 border-l-2 border-l-primary'
            : 'hover:bg-muted/50',
        ]"
        @click="selectItem(item)"
      >
        <!-- Icon -->
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          :class="[
            selectedItem && selectedItem.url === item.url
              ? 'bg-primary/20'
              : 'bg-muted',
          ]"
        >
          <Box
            class="w-5 h-5"
            :class="[
              selectedItem && selectedItem.url === item.url
                ? 'text-primary'
                : 'text-muted-foreground',
            ]"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-foreground truncate">{{ item.name }}</p>
          <p v-if="item.description" class="text-sm text-muted-foreground truncate">
            {{ item.description }}
          </p>
        </div>

        <!-- Delete button (only when authenticated) -->
        <Button
          v-if="canDelete"
          variant="ghost"
          size="sm"
          class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          @click.stop="deleteItem(item)"
        >
          <Trash2 class="w-4 h-4" />
        </Button>
      </li>
    </template>
  </LibraryBase>
</template>
