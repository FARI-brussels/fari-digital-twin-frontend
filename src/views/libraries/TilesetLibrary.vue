<template>
  <div class="tileset-library-container">
    <UploadTileset v-if="showUploadPage" @uploaded="handleTilesetUploaded" @cancel="showUploadPage = false" />
    <div v-else class="two-column-layout">
      <!-- Left Column: Tileset List -->
      <div class="left-column">
      <div class="header">
        <h1>Tileset Library</h1>
        <button @click="showUploadPage = true" class="upload-btn">Upload Tileset</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
        <div v-if="loading" class="loading-text">Loading tilesets...</div>
        <div v-if="!loading && tilesets.length === 0" class="no-items-text">
          No tilesets found.
        </div>

        <ul v-if="tilesets.length > 0" class="item-list">
          <li
            v-for="tileset in tilesets"
            :key="tileset.url"
            class="item"
            :class="{ 'selected': selectedTileset && selectedTileset.url === tileset.url }"
            @click="selectTileset(tileset)"
          >
            <div class="item-info">
              <span class="item-description">{{ tileset.description }}</span>
          </div>
            <button @click.stop="deleteTileset(tileset.url)" class="delete-btn">Delete</button>
        </li>
      </ul>
      </div>

      <!-- Right Column: Viewer and Code Snippet -->
      <div class="right-column">
        <div v-if="selectedTileset" class="viewer-section">
          <div class="viewer-container">
            <TilesetViewer :tilesetUrl="selectedTileset.url" />
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
          <p>Select a tileset from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import TilesetViewer from '../../components/TilesetViewer.vue';
import UploadTileset from '../../components/UploadTileset.vue';

const tilesets = ref([]);
const selectedTileset = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);
const selectedLanguage = ref('js'); // 'js' or 'unity'

const API_URL = process.env.API_URL;

const cesiumJsCodeSnippet = computed(() => {
  if (!selectedTileset.value) return '';
  return `
// Assumes 'viewer' is a Cesium.Viewer instance
import { Cesium3DTileset } from 'cesium';

try {
    const tileset = await Cesium3DTileset.fromUrl(
        '${selectedTileset.value.url}'
    );
    viewer.scene.primitives.add(tileset);
    await viewer.zoomTo(tileset);
} catch (error) {
    console.error(\`Error loading tileset: \${error}\`);
}
  `.trim();
});

const cesiumUnityCodeSnippet = computed(() => {
  if (!selectedTileset.value) return '';
  return `
// This script should be attached to a new GameObject.
// The GameObject should be a child of the CesiumGeoreference.
using UnityEngine;
using CesiumForUnity;

public class AddTilesetFromUrl : MonoBehaviour
{
    void Start()
    {
        var tileset = this.gameObject.AddComponent<Cesium3DTileset>();
        tileset.url = "${selectedTileset.value.url}";
    }
}
  `.trim();
});

const currentCodeSnippet = computed(() => {
  return selectedLanguage.value === 'js'
    ? cesiumJsCodeSnippet.value
    : cesiumUnityCodeSnippet.value;
});

const fetchTilesets = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(API_URL + '/tileset-manager');
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      tilesets.value = data.map(tileset => ({
        url: tileset.url,
        description: tileset.description || 'No description'
      }));
      selectedTileset.value = tilesets.value[0]; // Select first by default
    } else {
      tilesets.value = [];
    }
  } catch (err) {
    console.error('Error fetching tilesets:', err);
    error.value = 'Failed to fetch tilesets. Make sure the backend server is running.';
    tilesets.value = [];
  } finally {
    loading.value = false;
  }
};

const handleTilesetUploaded = () => {
  showUploadPage.value = false;
  fetchTilesets();
};

const deleteTileset = async (tilesetUrl) => {
  try {
    await axios.delete(`${API_URL}/tileset-manager/delete?url=${encodeURIComponent(tilesetUrl)}`);
    tilesets.value = tilesets.value.filter(t => t.url !== tilesetUrl);
    if (selectedTileset.value && selectedTileset.value.url === tilesetUrl) {
      selectedTileset.value = tilesets.value.length > 0 ? tilesets.value[0] : null;
    }
  } catch (err) {
    console.error('Error deleting tileset:', err);
    error.value = `Failed to delete tileset.`;
  }
};

const selectTileset = (tileset) => {
  selectedTileset.value = tileset;
};

onMounted(fetchTilesets);
</script>

<style scoped>
.tileset-library-container {
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
.upload-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  font-weight: bold;
}
.upload-btn:hover {
  background-color: #0056b3;
}
.item-list {
  list-style: none;
  padding: 0;
}
.item {
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
.item:hover {
  background-color: #f0f0f0;
}
.item.selected {
  border-left: 5px solid #007bff;
  background-color: #e7f3ff;
}
.item-info {
  display: flex;
  flex-direction: column;
}
.item-description {
  font-size: 1em;
  color: #333;
}
.delete-btn {
  background-color: #dc3545;
  color: white;
  font-weight: bold;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
.viewer-container {
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
.loading-text, .no-items-text {
  padding: 20px;
  text-align: center;
  color: #555;
}
</style> 