<template>
  <div class="asset-library-container">
    <UploadAsset v-if="showUploadPage" @uploaded="handleAssetUploaded" @cancel="showUploadPage = false" />
    <div v-else class="two-column-layout">
      <!-- Left Column: Asset List -->
      <div class="left-column">
        <div class="header">
          <h1>Asset Library</h1>
          <button @click="showUploadPage = true" class="upload-btn">Upload Asset</button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="loading" class="loading-text">Loading assets...</div>
        <div v-if="!loading && assets.length === 0" class="no-assets-text">
          No assets found.
        </div>
        <ul v-if="assets.length > 0" class="asset-list">
          <li
            v-for="asset in assets"
            :key="asset.url"
            class="asset-item"
            :class="{ 'selected': selectedAsset && selectedAsset.url === asset.url }"
            @click="selectAsset(asset)"
          >
            <div class="asset-info">
              <span class="asset-name">{{ asset.name }}</span>
            </div>
            <button @click.stop="deleteAsset(asset.url)" class="delete-btn">Delete</button>
          </li>
        </ul>
      </div>

      <!-- Right Column: Viewer and Code Snippet -->
      <div class="right-column">
        <div v-if="selectedAsset" class="viewer-section">
          <div class="model-viewer-container">
            <AssetViewer :assetUrl="selectedAsset.url" />
          </div>
          <div class="code-snippet-container">
            <div class="code-snippet-header">
              <h3>Code Example</h3>
              <div class="language-selector">
                <button :class="{ active: selectedLanguage === 'js' }" @click="selectedLanguage = 'js'">CesiumJS</button>
                <button :class="{ active: selectedLanguage === 'unity' }" @click="selectedLanguage = 'unity'">Cesium Unity</button>
              </div>
            </div>
            <pre><code>{{ currentCodeSnippet }}</code></pre>
          </div>
        </div>
        <div v-else class="placeholder">
          <p>Select an asset from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import AssetViewer from '../../components/AssetViewer.vue';
import UploadAsset from '../../components/UploadAsset.vue';

const assets = ref([]);
const selectedAsset = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);
const selectedLanguage = ref('js'); // 'js' or 'unity'

const cesiumJsCodeSnippet = computed(() => {
  if (!selectedAsset.value) return '';
  return `
import { Viewer, Cartesian3, HeadingPitchRange, Math as CesiumMath } from 'cesium';

// Assumes you have a container with id 'cesiumContainer'
const viewer = new Viewer('cesiumContainer');

// Define a position for the model on the globe.
// This example places it in Brussels.
const position = Cartesian3.fromDegrees(4.3517, 50.8503, 0);

// Add the GLB model as an entity.
const entity = viewer.entities.add({
    position: position,
    model: {
        uri: '${selectedAsset.value.url}',
        minimumPixelSize: 128,
        maximumScale: 20000
    }
});

// Zoom the camera to the model.
viewer.zoomTo(entity, new HeadingPitchRange(
    CesiumMath.toRadians(45),
    CesiumMath.toRadians(-30),
    200
));
  `.trim();
});

const cesiumUnityCodeSnippet = computed(() => {
  if (!selectedAsset.value) return '';
  return `
// Make sure to add the Cesium for Unity package to your project.
using UnityEngine;
using CesiumForUnity;

public class LoadGltfModel : MonoBehaviour
{
    // This script should be attached to an empty GameObject.
    // The GameObject should also have a CesiumGlobeAnchor component to place it on the globe.
    void Start()
    {
        // Add the CesiumGltfModel component to this GameObject.
        CesiumGltfModel gltfModel = this.gameObject.AddComponent<CesiumGltfModel>();
        
        // Set the URL of your GLB/GLTF model.
        gltfModel.url = "${selectedAsset.value.url}";
    }
}
  `.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
});

const currentCodeSnippet = computed(() => {
  return selectedLanguage.value === 'js' ? cesiumJsCodeSnippet.value : cesiumUnityCodeSnippet.value;
});

const fetchAssets = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(process.env.API_URL + '/assets-manager');
    const data = response.data;
    if (Array.isArray(data)) {
        assets.value = data.map(asset => ({
            name: asset.url.split('/').pop(),
            url: asset.url,
            description: asset.description
        }));
        if (assets.value.length > 0) {
            selectedAsset.value = assets.value[0];
        }
    } else {
        assets.value = [];
    }
  } catch (err) {
    console.error('Error fetching assets:', err);
    error.value = 'Failed to fetch assets. Make sure the backend server is running.';
    assets.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAssetUploaded = () => {
  showUploadPage.value = false;
  fetchAssets();
};

const deleteAsset = async (assetUrl) => {
  try {
    await axios.delete(`${process.env.API_URL}/assets-manager/delete?url=${encodeURIComponent(assetUrl)}`);
    assets.value = assets.value.filter(asset => asset.url !== assetUrl);
    if (selectedAsset.value && selectedAsset.value.url === assetUrl) {
      selectedAsset.value = assets.value.length > 0 ? assets.value[0] : null;
    }
  } catch (err) {
    console.error('Error deleting asset:', err);
    error.value = `Failed to delete asset ${assetUrl}.`;
  }
};

const selectAsset = (asset) => {
  selectedAsset.value = asset;
};

onMounted(fetchAssets);
</script>

<style scoped>
.asset-library-container {
  height: 100vh;
  display: flex;
}

.two-column-layout {
  display: flex;
  width: 100%;
}

.left-column {
  width: 40%;
  padding: 20px;
  border-right: 1px solid #ccc;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.right-column {
  width: 60%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1, h3 {
  color: #333;
}

.upload-btn, .delete-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-weight: bold;
}

.upload-btn {
  background-color: #007bff;
}

.upload-btn:hover {
  background-color: #0056b3;
}

.asset-list {
  list-style: none;
  padding: 0;
}

.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  margin-bottom: 5px;
  border-radius: 5px;
  background-color: #fff;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s;
}

.asset-item:hover {
  background-color: #f0f0f0;
}

.asset-item.selected {
  border-left: 5px solid #007bff;
  background-color: #e7f3ff;
}

.asset-info {
  display: flex;
  flex-direction: column;
}

.asset-name {
  font-size: 1em;
  font-weight: bold;
}

.delete-btn {
  background-color: #dc3545;
  opacity: 0.8;
}

.delete-btn:hover {
  opacity: 1;
}

.viewer-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.model-viewer-container {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  min-height: 300px; /* Or other appropriate size */
}

.code-snippet-container {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  height: 250px; /* Fixed height for the code snippet area */
}

.code-snippet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.language-selector button {
  background-color: #444;
  color: #f8f8f2;
  border: 1px solid #555;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 3px;
}

.language-selector button.active {
  background-color: #007bff;
  border-color: #007bff;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #777;
  font-size: 1.2em;
}

.error {
  color: red;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid red;
  border-radius: 5px;
  background-color: #ffe0e0;
}

.loading-text, .no-assets-text {
  padding: 20px;
  text-align: center;
  color: #555;
}
</style> 