<script setup>
import LibraryBase from '../../components/LibraryBase.vue';
import TilesetViewer from '../../components/TilesetViewer.vue';
import UploadTileset from '../../components/UploadTileset.vue';

const transformTilesetData = (data) => {
  return data.map(tileset => ({
    ...tileset,
    description: tileset.description || 'No description'
  }));
};

const getCesiumJsSnippet = (tileset) => `
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

const getCesiumUnitySnippet = (tileset) => `
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

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>

<template>
  <LibraryBase title="Tileset Library" itemType="tileset" fetchUrl="/tileset-manager"
    deleteUrlBase="/tileset-manager/delete" :viewerComponent="TilesetViewer" :uploadComponent="UploadTileset"
    :codeSnippets="codeSnippets" :transformData="transformTilesetData">
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <li v-for="item in items" :key="item.url"
        class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
        :class="{ 'bg-blue-50': selectedItem && selectedItem.url === item.url }" @click="selectItem(item)">
        <div class="font-bold">{{ item.description }}</div>
        <button @click.stop="deleteItem(item)"
          class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
      </li>
    </template>
  </LibraryBase>
</template>