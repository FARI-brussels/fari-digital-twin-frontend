<script setup lang="ts">
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import TilesetViewer from '@/components/TilesetViewer.vue';
import UploadTileset from '@/components/UploadTileset.vue';
import { useTilesetsQuery, useDeleteTilesetMutation } from '@/api';
import type { Tileset, LibraryItem } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface TilesetItem extends LibraryItem {
  url: string;
  description: string;
}

// ============================================================================
// Query & Mutations
// ============================================================================

const { data: rawTilesets, isLoading, error, refetch } = useTilesetsQuery();
const deleteTilesetMutation = useDeleteTilesetMutation();

// ============================================================================
// Computed
// ============================================================================

const tilesets = computed<TilesetItem[]>(() => {
  if (!rawTilesets.value) return [];
  return rawTilesets.value.map((tileset: Tileset) => ({
    ...tileset,
    description: tileset.description ?? 'No description',
  }));
});

// ============================================================================
// Handlers
// ============================================================================

async function handleDelete(item: LibraryItem): Promise<void> {
  if (!item.url) throw new Error('Tileset has no URL');
  await deleteTilesetMutation.mutateAsync(item.url);
}

function handleUploaded(): void {
  void refetch();
}

// ============================================================================
// Code Snippets
// ============================================================================

function getCesiumJsSnippet(tileset: LibraryItem): string {
  return `
import { Cesium3DTileset } from 'cesium';
try {
    const tileset = await Cesium3DTileset.fromUrl(
        '${tileset.url}'
    );
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
} catch (error) {
    console.error(\`Error loading tileset: \${error}\`);
}
`.trim();
}

function getCesiumUnitySnippet(tileset: LibraryItem): string {
  return `
using UnityEngine;
using CesiumForUnity;
public class AddTilesetFromUrl : MonoBehaviour
{
    void Start()
    {
        var tileset = this.gameObject.AddComponent<Cesium3DTileset>();
        tileset.url = "${tileset.url}";
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
    title="Tileset Library"
    itemType="tileset"
    :viewerComponent="TilesetViewer"
    :uploadComponent="UploadTileset"
    :codeSnippets="codeSnippets"
    :items="tilesets"
    :isLoading="isLoading"
    :error="error"
    :onDelete="handleDelete"
    @uploaded="handleUploaded"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <li
        v-for="item in items"
        :key="item.url"
        class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
        :class="{ 'bg-blue-50': selectedItem && selectedItem.url === item.url }"
        @click="selectItem(item)"
      >
        <div class="font-bold">{{ item.description }}</div>
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
