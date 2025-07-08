<template>
  <LibraryBase
    title="Map Layer Library"
    itemType="map"
    fetchUrl="/maps-manager/all"
    :viewerComponent="MapViewer"
    :uploadComponent="UploadMapLayer"
    :codeSnippets="codeSnippets"
    :deleteItem="deleteMapLayer"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
       <div v-for="(layers, provider) in groupedLayers(items)" :key="provider" class="provider-group">
          <h2 class="provider-name">{{ provider }}</h2>
          <ul class="asset-list">
            <li
              v-for="layer in layers"
              :key="layer.layer"
              class="asset-item"
              :class="{ 'selected': selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url }"
              @click="selectItem(layer)"
            >
              <div class="layer-info">
                <span class="layer-description">{{ layer.description }}</span>
              </div>
              <button @click.stop="deleteItem(layer)" class="delete-btn">Delete</button>
            </li>
          </ul>
        </div>
    </template>
  </LibraryBase>
</template>

<script setup>
import { computed } from 'vue';
import { deleteMapLayer as apiDeleteMapLayer } from '@/lib/api';
import LibraryBase from '@/components/LibraryBase.vue';
import MapViewer from '@/components/MapViewer.vue';
import UploadMapLayer from '@/components/UploadMapLayer.vue';

const groupedLayers = (layers) => {
  if (!Array.isArray(layers)) {
    return {};
  }
  return layers.reduce((acc, layer) => {
    const provider = layer.url;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(layer);
    return acc;
  }, {});
};

const deleteMapLayer = async (layer) => {
  try {
    await apiDeleteMapLayer(layer);
  } catch (err) {
    console.error('Error deleting map layer:', err);
    // You should probably show an error message to the user
  }
};

const getCesiumJsSnippet = (layer) => `
import { Viewer, WebMapServiceImageryProvider } from 'cesium';
const viewer = new Viewer('cesiumContainer');
const wmsProvider = new WebMapServiceImageryProvider({
    url: '${layer.url}',
    layers: '${layer.layer}',
    parameters: {
        transparent: true,
        format: 'image/png'
    }
});
viewer.imageryLayers.addImageryProvider(wmsProvider);
`.trim();

const getCesiumUnitySnippet = (layer) => `
using UnityEngine;
using CesiumForUnity;
public class AddWmsLayer : MonoBehaviour
{
    void Start()
    {
        CesiumWebMapServiceRasterOverlay wmsOverlay = this.gameObject.AddComponent<CesiumWebMapServiceRasterOverlay>();
        wmsOverlay.baseUrl = "${layer.url}";
        wmsOverlay.layers = "${layer.layer}";
    }
}
`.trim();

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>

<style scoped>
.provider-group {
  margin-bottom: 20px;
}
.provider-name {
  font-size: 1.2em;
  font-weight: bold;
  padding: 10px;
  background-color: #e9ecef;
  border-bottom: 1px solid #ccc;
}
.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.asset-item:hover {
  background-color: #f0f0f0;
}
.asset-item.selected {
  background-color: #e0eaf6;
}
.layer-description {
  font-weight: bold;
}
.delete-btn {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.delete-btn:hover {
  background-color: #cc0000;
}
</style> 