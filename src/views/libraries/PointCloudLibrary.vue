<template>
  <div class="pointcloud-library">
    <div v-if="!showUploadPage && !selectedPointCloud">
      <div class="header">
        <h1>Point Cloud Library</h1>
        <button @click="showUploadPage = true" class="upload-btn">Upload Point Cloud</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <ul v-if="pointClouds.length > 0" class="asset-list">
        <li v-for="pc in pointClouds" :key="pc.url" class="asset-item">
          <span>{{ pc.name }}</span>
          <div class="actions">
            <button @click="visualizePointCloud(pc)">Visualize</button>
            <button @click="deletePointCloud(pc.url)">Delete</button>
          </div>
        </li>
      </ul>
      <div v-else-if="!error && !loading">
        No point clouds found.
      </div>
      <div v-if="loading">Loading point clouds...</div>
    </div>
    <UploadPointCloud v-if="showUploadPage" @uploaded="handlePointCloudUploaded" @cancel="showUploadPage = false" />
    <PointCloudViewer v-if="selectedPointCloud" :pointCloudUrl="selectedPointCloud.url" @close="selectedPointCloud = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import UploadPointCloud from '../../components/UploadPointCloud.vue';
import PointCloudViewer from '../../components/PointCloudViewer.vue';

const pointClouds = ref([]);
const selectedPointCloud = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);


const getFileNameFromUrl = (url) => {
  try {
    return new URL(url).pathname.split('/').pop();
  } catch (e) {
    return url;
  }
};

const fetchPointClouds = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(process.env.API_URL + '/pointcloud-manager');
    pointClouds.value = response.data.map(pc => ({
      ...pc,
      name: getFileNameFromUrl(pc.url)
    }));
  } catch (err) {
    console.error('Error fetching point clouds:', err);
    error.value = 'Failed to fetch point clouds. Make sure the backend server is running.';
    pointClouds.value = [];
  } finally {
    loading.value = false;
  }
};

const deletePointCloud = async (pcUrl) => {
  try {
    await axios.delete(`${API_URL}/delete?url=${encodeURIComponent(pcUrl)}`);
    pointClouds.value = pointClouds.value.filter(pc => pc.url !== pcUrl);
  } catch (err) {
    console.error('Error deleting point cloud:', err);
    error.value = `Failed to delete point cloud ${getFileNameFromUrl(pcUrl)}.`;
  }
};

const visualizePointCloud = (pc) => {
  selectedPointCloud.value = pc;
};

const handlePointCloudUploaded = () => {
  showUploadPage.value = false;
  fetchPointClouds();
};

onMounted(fetchPointClouds);
</script>

<style scoped>
/* Using similar styles to App.vue for consistency */
.pointcloud-library {
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