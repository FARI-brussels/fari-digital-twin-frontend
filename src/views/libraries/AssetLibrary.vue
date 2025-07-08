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
        class="asset-item"
        :class="{ 'selected': selectedItem && selectedItem.url === item.url }"
        @click="selectItem(item)"
      >
        <div class="asset-info">
          <span class="asset-name">{{ item.name }}</span>
        </div>
        <button @click.stop="deleteItem(item)" class="delete-btn">Delete</button>
      </li>
    </template>
  </LibraryBase>
</template>

<script setup>
import LibraryBase from '../../components/LibraryBase.vue';
import AssetViewer from '../../components/AssetViewer.vue';
import UploadAsset from '../../components/UploadAsset.vue';

const transformAssetData = (data) => {
  return data.map(asset => ({
    ...asset,
    name: asset.url.split('/').pop(),
  }));
};

const getCesiumJsSnippet = (asset) => `
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

const getCesiumUnitySnippet = (asset) => `
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

const codeSnippets = {
  js: getCesiumJsSnippet,
  unity: getCesiumUnitySnippet,
};
</script>

<style scoped>
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
.asset-name {
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