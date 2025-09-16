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

<template>
  <LibraryBase title="Map Layer Library" itemType="map" fetchUrl="/maps-manager/all" :viewerComponent="MapViewer"
    :uploadComponent="UploadMapLayer" :codeSnippets="codeSnippets" :deleteItem="deleteMapLayer">
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <div v-for="(layers, provider) in groupedLayers(items)" :key="provider" class="mb-5">
        <h2 class="text-lg font-bold bg-gray-100 px-4 py-2 border-b">{{ provider }}</h2>
        <ul>
          <li v-for="layer in layers" :key="layer.layer"
            class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
            :class="{ 'bg-blue-50': selectedItem && selectedItem.layer === layer.layer && selectedItem.url === layer.url }"
            @click="selectItem(layer)">
            <div class="font-bold">{{ layer.description }}</div>
            <button @click.stop="deleteItem(layer)"
              class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
          </li>
        </ul>
      </div>
    </template>
  </LibraryBase>
</template>