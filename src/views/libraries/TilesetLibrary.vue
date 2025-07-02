<template>
  <div class="tileset-library">
    <div v-if="!showUploadPage">
      <div class="header">
        <h1>Tileset Library</h1>
        <button @click="showUploadPage = true" class="upload-btn">Upload Tileset</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <ul v-if="tilesets.length > 0" class="tileset-list">
        <li v-for="tileset in tilesets" :key="tileset.url" class="tileset-item">
          <span>{{ tileset.name }}</span>
          <div class="actions">
            <button @click="visualizeTileset(tileset)">Visualize</button>
            <button @click="deleteTileset(tileset.url)">Delete</button>
          </div>
        </li>
      </ul>
      <div v-else-if="!error && !loading">
        No tilesets found.
      </div>
      <div v-if="loading">Loading tilesets...</div>
    </div>
    <UploadTileset v-else @uploaded="handleTilesetUploaded" @cancel="showUploadPage = false" />

    <TilesetViewer v-if="selectedTileset" :tilesetUrl="selectedTileset.url" @close="selectedTileset = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import TilesetViewer from '../../components/TilesetViewer.vue';
import UploadTileset from '../../components/UploadTileset.vue';

const tilesets = ref([]);
const selectedTileset = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);

const API_URL = process.env.API_URL

const fetchTilesets = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(API_URL + '/tileset-manager');
    console.log(response.data);
    tilesets.value = response.data.map(tileset => {
        return { name: tileset.url, url: tileset.url, description: tileset.description };
    });
  } catch (err) {
    console.error('Error fetching tilesets:', err);
    error.value = 'Failed to fetch tilesets. Make sure the backend server is running on ' + API_URL + '/tileset-manager.';
    tilesets.value = []; // Clear tilesets on error
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
    tilesets.value = tilesets.value.filter(tileset => tileset.url !== tilesetUrl);
  } catch (err) {
    console.error('Error deleting tileset:', err);
    error.value = `Failed to delete tileset ${tilesetUrl}.`;
  }
};

const visualizeTileset = (tileset) => {
  selectedTileset.value = tileset;
};

onMounted(() => {
  fetchTilesets();
});
</script>

<style scoped>
.tileset-library {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.upload-btn {
  padding: 10px 15px;
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
h1 {
  color: #42b983;
  margin: 0;
}
.tileset-list {
  list-style: none;
  padding: 0;
}
.tileset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}
.tileset-item span {
  font-size: 1.1em;
}
.actions button {
  margin-left: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  font-weight: bold;
}
.actions button:hover {
  background-color: #369f77;
}
.actions button:last-child {
  background-color: #dc3545;
}
.actions button:last-child:hover {
  background-color: #c82333;
}
.error {
  color: red;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid red;
  border-radius: 5px;
  background-color: #ffe0e0;
}
</style> 