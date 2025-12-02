<script setup lang="ts">
/**
 * MapLibrary - Browse and manage WMS map layers
 * Supports deleting individual layers or all layers from a provider
 * Delete buttons only shown when authenticated
 */
import { computed, ref } from 'vue';
import LibraryBase from '@/components/LibraryBase.vue';
import MapViewer from '@/components/MapViewer.vue';
import UploadMapLayer from '@/components/UploadMapLayer.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { Button } from '@/components/ui/button';
import { useMapLayersQuery, useDeleteMapLayerMutation, useDeleteAllLayersFromServerMutation } from '@/api';
import type { MapLayer, LibraryItem, GroupedLayers } from '@/types';
import { Trash2, Layers, ChevronDown, ChevronRight, Globe } from 'lucide-vue-next';

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
const deleteAllFromServerMutation = useDeleteAllLayersFromServerMutation();

// ============================================================================
// State
// ============================================================================

// Use Map for better reactivity (avoids forced Set recreation)
const expandedProviders = ref<Map<string, boolean>>(new Map());
const deletingProvider = ref<string | null>(null);

// Delete all from provider confirmation state
const showDeleteAllConfirm = ref(false);
const providerToDelete = ref<string | null>(null);
const isDeletingAll = ref(false);

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

function toggleProvider(provider: string | number): void {
  const key = String(provider);
  const current = expandedProviders.value.get(key) ?? false;
  expandedProviders.value.set(key, !current);
}

function isProviderExpanded(provider: string | number): boolean {
  return expandedProviders.value.get(String(provider)) ?? false;
}

function getProviderName(url: string | number): string {
  const urlStr = String(url);
  try {
    const urlObj = new URL(urlStr);
    return urlObj.hostname;
  } catch {
    return urlStr.substring(0, 30) + '...';
  }
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

/** Opens confirmation dialog for deleting all layers from a provider */
function requestDeleteAllFromProvider(provider: string | number): void {
  providerToDelete.value = String(provider);
  showDeleteAllConfirm.value = true;
}

/** Actually performs the delete all after confirmation */
async function confirmDeleteAllFromProvider(): Promise<void> {
  if (!providerToDelete.value) return;

  isDeletingAll.value = true;
  deletingProvider.value = providerToDelete.value;

  try {
    await deleteAllFromServerMutation.mutateAsync(providerToDelete.value);
    void refetch();
    showDeleteAllConfirm.value = false;
    providerToDelete.value = null;
  } finally {
    isDeletingAll.value = false;
    deletingProvider.value = null;
  }
}

/** Cancels the delete all operation */
function cancelDeleteAll(): void {
  showDeleteAllConfirm.value = false;
  providerToDelete.value = null;
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
    <template #list-item="{ items, selectedItem, selectItem, deleteItem, canDelete }">
      <li v-for="(layers, provider) in groupedLayers(items)" :key="provider" class="list-none">
        <!-- Provider Header -->
        <div
          class="group flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border cursor-pointer transition-colors hover:bg-muted/60"
          @click="toggleProvider(provider)"
        >
          <!-- Expand/Collapse Icon -->
          <ChevronDown
            v-if="isProviderExpanded(provider)"
            class="w-4 h-4 text-muted-foreground shrink-0 transition-transform"
          />
          <ChevronRight
            v-else
            class="w-4 h-4 text-muted-foreground shrink-0"
          />

          <!-- Provider Icon -->
          <div class="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Globe class="w-5 h-5 text-muted-foreground" />
          </div>

          <!-- Provider Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-foreground truncate">{{ getProviderName(provider) }}</p>
            <p class="text-xs text-muted-foreground">
              {{ layers.length }} layer{{ layers.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Delete All Button (only when authenticated) -->
          <Button
            v-if="canDelete"
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
            :disabled="deletingProvider === String(provider)"
            @click.stop="requestDeleteAllFromProvider(provider)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>

        <!-- Layers List (collapsible) -->
        <ul v-if="isProviderExpanded(provider)" class="list-none">
          <li
            v-for="layer in layers"
            :key="`${layer.url}-${layer.layer}`"
            class="group flex items-center gap-3 px-4 py-3 pl-12 border-b border-border cursor-pointer transition-colors"
            :class="[
              selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                ? 'bg-accent/10 border-l-2 border-l-accent'
                : 'hover:bg-muted/50',
            ]"
            @click="selectItem(layer)"
          >
            <!-- Layer Icon -->
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :class="[
                selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                  ? 'bg-accent/20'
                  : 'bg-muted',
              ]"
            >
              <Layers
                class="w-5 h-5"
                :class="[
                  selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url
                    ? 'text-accent'
                    : 'text-muted-foreground',
                ]"
              />
            </div>

            <!-- Layer Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-foreground truncate">{{ layer.description }}</p>
              <p class="text-xs text-muted-foreground font-mono truncate">{{ layer.layer }}</p>
            </div>

            <!-- Delete Single Layer Button (only when authenticated) -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              class="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              @click.stop="deleteItem(layer)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </li>
        </ul>
      </li>
    </template>
  </LibraryBase>

  <!-- Delete All Layers Confirmation Dialog -->
  <ConfirmDialog
    v-model:open="showDeleteAllConfirm"
    title="Delete All Layers"
    :description="`Are you sure you want to delete ALL layers from '${providerToDelete ? getProviderName(providerToDelete) : ''}'? This action cannot be undone.`"
    confirm-text="Delete All"
    cancel-text="Cancel"
    variant="danger"
    :loading="isDeletingAll"
    @confirm="confirmDeleteAllFromProvider"
    @cancel="cancelDeleteAll"
  />
</template>
