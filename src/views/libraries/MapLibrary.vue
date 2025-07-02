<template>
  <div class="map-library">
    <div v-if="!showUploadPage && !selectedMapLayer">
      <div class="header">
        <h1>Map Layer Library</h1>
        <button @click="showUploadPage = true" class="upload-btn">Add Map Layer</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <ul v-if="mapLayers.length > 0" class="asset-list">
        <li v-for="layer in mapLayers" :key="`${layer.url}-${layer.layer}`" class="asset-item">
          <div class="layer-info">
            <span class="layer-name">{{ layer.layer }}</span>
            <span class="layer-description">{{ layer.description }}</span>
            <span class="layer-url">Provider: {{ layer.url }}</span>
          </div>
          <div class="actions">
            <button @click="visualizeMap(layer)">Visualize</button>
            <button @click="deleteMapLayer(layer)">Delete</button>
          </div>
        </li>
      </ul>
      <div v-else-if="!error && !loading">
        No map layers found.
      </div>
      <div v-if="loading">Loading map layers...</div>
    </div>
    <UploadMapLayer v-if="showUploadPage" @uploaded="handleMapLayerUploaded" @cancel="showUploadPage = false" />
    <MapViewer v-if="selectedMapLayer" :mapLayer="selectedMapLayer" @close="selectedMapLayer = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import UploadMapLayer from '../../components/UploadMapLayer.vue';
import MapViewer from '../../components/MapViewer.vue';

const mapLayers = ref([]);
const selectedMapLayer = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);


const fetchMapLayers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(process.env.API_URL + '/maps-manager/all');
    const data = response.data;
    console.log(data);
    if (Array.isArray(data)) {
      // The API returns an array of objects, each with a 'layer' property.
      mapLayers.value = data
    } else {
      console.warn("Received unexpected data format for map layers:", data);
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
    // Assuming a delete endpoint that takes url and layer as query params
    await axios.delete(`${process.env.API_URL}/maps-manager/delete?url=${encodeURIComponent(layer._url)}`);
    mapLayers.value = mapLayers.value.filter(l => !(l.url === layer.url && l.layer === layer.layer));
  } catch (err) {
    console.error('Error deleting map layer:', err);
    error.value = `Failed to delete map layer ${layer.layer}.`;
  }
};

const visualizeMap = (layer) => {
  selectedMapLayer.value = layer;
};

const handleMapLayerUploaded = () => {
  showUploadPage.value = false;
  fetchMapLayers();
};

onMounted(fetchMapLayers);
</script>

<style scoped>
.map-library {
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
h1 {
  color: #42b983;
  margin: 0;
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
.asset-list {
  list-style: none;
  padding: 0;
}
.asset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}
.layer-info {
  display: flex;
  flex-direction: column;
}
.layer-name {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
}
.layer-description {
  color: #555;
  margin-bottom: 8px;
}
.layer-url {
  font-size: 0.9em;
  color: #777;
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