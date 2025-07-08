<template>
  <div class="map-library-container">
    <UploadMapLayer v-if="showUploadPage" @uploaded="handleMapLayerUploaded" @cancel="showUploadPage = false" />
    <div v-else class="two-column-layout">
      <!-- Left Column: Layer List -->
      <div class="left-column">
        <div class="header">
          <h1>Map Layer Library</h1>
          <button @click="showUploadPage = true" class="upload-btn">Add Map Layer</button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="loading" class="loading-text">Loading map layers...</div>
        <div v-if="!loading && Object.keys(groupedLayers).length === 0" class="no-layers-text">
          No map layers found.
        </div>

        <div v-for="(layers, provider) in groupedLayers" :key="provider" class="provider-group">
          <h2 class="provider-name">{{ provider }}</h2>
          <ul class="asset-list">
            <li
              v-for="layer in layers"
              :key="layer.layer"
              class="asset-item"
              :class="{ 'selected': selectedMapLayer && selectedMapLayer.layer === layer.layer && selectedMapLayer.url === layer.url }"
              @click="selectLayer(layer)"
            >
              <div class="layer-info">
                <span class="layer-description">{{ layer.description }}</span>
              </div>
              <button @click.stop="deleteMapLayer(layer)" class="delete-btn">Delete</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right Column: Map Viewer and Code Snippet -->
      <div class="right-column">
        <div v-if="selectedMapLayer" class="viewer-section">
          <div class="map-viewer-container">
            <MapViewer :mapLayer="selectedMapLayer" />
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
          <p>Select a layer from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import UploadMapLayer from '../../components/UploadMapLayer.vue';
import MapViewer from '../../components/MapViewer.vue';

const mapLayers = ref([]);
const selectedMapLayer = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);
const selectedLanguage = ref('js'); // 'js' or 'unity'

const groupedLayers = computed(() => {
  if (!Array.isArray(mapLayers.value)) {
    return {};
  }
  return mapLayers.value.reduce((acc, layer) => {
    const provider = layer.url;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(layer);
    return acc;
  }, {});
});

const cesiumJsCodeSnippet = computed(() => {
  if (!selectedMapLayer.value) {
    return '';
  }
  const { url, layer } = selectedMapLayer.value;
  return `
import { Viewer, WebMapServiceImageryProvider } from 'cesium';

// Assumes you have a container with id 'cesiumContainer'
const viewer = new Viewer('cesiumContainer');

const layer = new WebMapServiceImageryProvider({
    url: '${url}',
    layers: '${layer}',
    parameters: {
        transparent: true,
        format: 'image/png'
    }
});

viewer.imageryLayers.addImageryProvider(layer);
  `.trim();
});

const cesiumUnityCodeSnippet = computed(() => {
  if (!selectedMapLayer.value) {
    return '';
  }
  const { url, layer } = selectedMapLayer.value;
  return `
// Make sure to add the Cesium for Unity package to your project.
// This script should be attached to the CesiumGeoreference GameObject.
using UnityEngine;
using CesiumForUnity;

public class AddWmsLayer : MonoBehaviour
{
    void Start()
    {
        CesiumWebMapServiceRasterOverlay wmsOverlay = this.gameObject.AddComponent<CesiumWebMapServiceRasterOverlay>();
        wmsOverlay.baseUrl = "${url}";
        wmsOverlay.layers = "${layer}";
    }
}
  `.trim();
});

const currentCodeSnippet = computed(() => {
  if (selectedLanguage.value === 'js') {
    return cesiumJsCodeSnippet.value;
  }
  return cesiumUnityCodeSnippet.value;
});

const fetchMapLayers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(process.env.API_URL + '/maps-manager/all');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      mapLayers.value = data;
      // Select the first layer by default
      selectedMapLayer.value = data[0];
    } else {
      console.warn("Received unexpected data format for map layers or no layers found:", data);
      mapLayers.value = [];
    }
  } catch (err) {
    console.error('Error fetching map layers:', err);
    error.value = 'Failed to fetch map layers. Make sure the backend server is running.';
    mapLayers.value = [];
  } finally {
    loading.value = false;
  }
};

const deleteMapLayer = async (layer) => {
  try {
    await axios.delete(`${process.env.API_URL}/maps-manager/delete?url=${encodeURIComponent(layer.url)}&layer=${encodeURIComponent(layer.layer)}`);
    mapLayers.value = mapLayers.value.filter(l => !(l.url === layer.url && l.layer === layer.layer));
    if (selectedMapLayer.value && selectedMapLayer.value.url === layer.url && selectedMapLayer.value.layer === layer.layer) {
      selectedMapLayer.value = null;
    }
  } catch (err) {
    console.error('Error deleting map layer:', err);
    error.value = `Failed to delete map layer ${layer.layer}.`;
  }
};

const selectLayer = (layer) => {
  selectedMapLayer.value = layer;
};

const handleMapLayerUploaded = () => {
  showUploadPage.value = false;
  fetchMapLayers();
};

onMounted(fetchMapLayers);
</script>

<style scoped>
.map-library-container {
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

h1, h2, h3 {
  color: #333;
}

.provider-group {
  margin-bottom: 20px;
}

.provider-name {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 10px;
  color: #0056b3;
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

.layer-info {
  display: flex;
  flex-direction: column;
}

.layer-name {
  font-size: 1em;
  font-weight: bold;
}

.layer-description {
  font-size: 0.9em;
  color: #555;
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

.map-viewer-container {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
  min-height: 300px;
}

.code-snippet-container {
  background-color: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
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

.loading-text, .no-layers-text {
  padding: 20px;
  text-align: center;
  color: #555;
}
</style> 