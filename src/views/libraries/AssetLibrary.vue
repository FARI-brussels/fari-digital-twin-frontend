<template>

  <div class="asset-library">
    <div v-if="!showUploadPage">
      <div class="header">
        <h1>Asset Library</h1>
        <button @click="showUploadPage = true" class="upload-btn">Upload Asset</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <ul v-if="assets.length > 0" class="asset-list">
        <li v-for="asset in assets" :key="asset.url" class="asset-item">
          <span>{{ asset.name }}</span>
          <div class="actions">
            <button @click="visualizeAsset(asset)">Visualize</button>
            <button @click="deleteAsset(asset.url)">Delete</button>
          </div>
        </li>
      </ul>
      <div v-else-if="!error && !loading">
        No assets found.
      </div>
      <div v-if="loading">Loading assets...</div>
    </div>
    <UploadAsset v-else @uploaded="handleAssetUploaded" @cancel="showUploadPage = false" />

    <ModelViewer v-if="selectedAsset" :assetUrl="selectedAsset.url" @close="selectedAsset = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import ModelViewer from '../../components/ModelViewer.vue';
import UploadAsset from '../../components/UploadAsset.vue';
import LibraryLayout from "../../components/LibraryLayout.vue";

const assets = ref([]);
const selectedAsset = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);


const fetchAssets = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(process.env.API_URL + '/assets-manager');
    console.log(response.data);
    assets.value = response.data.map(asset => {
        return { name: asset.url, url: asset.url, description: asset.description };
    });
  } catch (err) {
    console.error('Error fetching assets:', err);
    error.value = 'Failed to fetch assets. Make sure the backend server is running on ' + process.env.API_URL + '/assets-manager.';
    assets.value = []; // Clear assets on error
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
    // The user specified DELETE localhost:8080/assets-manager?url=asset_url
    // This looks like the asset_url is a query parameter.
    await axios.delete(`${process.env.API_URL}/assets-manager/delete?url=${encodeURIComponent(assetUrl)}`);
    assets.value = assets.value.filter(asset => asset.url !== assetUrl);
  } catch (err) {
    console.error('Error deleting asset:', err);
    error.value = `Failed to delete asset ${assetUrl}.`;
  }
};

const visualizeAsset = (asset) => {
  if (asset.name.endsWith('.glb') || asset.name.endsWith('.gltf')) {
    selectedAsset.value = asset;
  } else {
    alert('Visualization is only supported for .glb or .gltf files.');
  }
};

onMounted(() => {
  fetchAssets();
});
</script>

<style scoped>
.asset-library {
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
  margin-bottom: 10px;
  border-radius: 5px;
  background-color: #f9f9f9;
}
.asset-item span {
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