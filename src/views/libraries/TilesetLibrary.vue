<template>
  <LibraryBase
    title="Tileset Library"
    itemType="tileset"
    fetchUrl="/tileset-manager"
    deleteUrlBase="/tileset-manager/delete"
    :viewerComponent="TilesetViewer"
    :uploadComponent="UploadTileset"
    :codeSnippets="codeSnippets"
    :transformData="transformTilesetData"
  >
    <template #list-item="{ items, selectedItem, selectItem, deleteItem }">
      <li
        v-for="item in items"
        :key="item.url"
        class="item"
        :class="{ 'selected': selectedItem && selectedItem.url === item.url }"
        @click="selectItem(item)"
      >
        <div class="item-info">
          <span class="item-description">{{ item.description }}</span>
        </div>
        <button @click.stop="deleteItem(item)" class="delete-btn">Delete</button>
      </li>
    </template>
  </LibraryBase>
</template>

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

<style scoped>
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.item:hover {
  background-color: #f0f0f0;
}
.item.selected {
  background-color: #e0eaf6;
}
.item-description {
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