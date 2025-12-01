<script setup lang="ts">
/**
 * TilesetLibrary - Browse and manage 3D Tilesets
 * Delete button only shown when authenticated
 */
import { computed } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import TilesetViewer from '@/components/TilesetViewer.vue';
import UploadTileset from '@/components/UploadTileset.vue';
import { Button } from '@/components/ui/button';
import { useTilesetsQuery, useDeleteTilesetMutation } from '@/api';
import type { Tileset, LibraryItem } from '@/types';
import { Trash2, Building } from 'lucide-vue-next';

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
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li
        v-for="item in items"
        :key="item.id"
        class="group flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors"
        :class="[
          selectedItem && selectedItem.id === item.id
            ? 'bg-accent/10 border-l-2 border-l-accent'
            : 'hover:bg-muted/50',
        ]"
        @click="selectItem(item)"
      >
        <!-- Icon -->
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          :class="[
            selectedItem && selectedItem.id === item.id
              ? 'bg-accent/20'
              : 'bg-muted',
          ]"
        >
          <Building
            class="w-5 h-5"
            :class="[
              selectedItem && selectedItem.id === item.id
                ? 'text-accent'
                : 'text-muted-foreground',
            ]"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-foreground truncate">{{ item.description }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ item.url?.split('/').pop() ?? '' }}</p>
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
