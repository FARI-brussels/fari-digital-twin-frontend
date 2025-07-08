<template>
  <div class="library-container">
    <component :is="uploadComponent" v-if="showUploadPage" @uploaded="handleItemUploaded" @cancel="showUploadPage = false" />
    <div v-else class="two-column-layout">
      <!-- Left Column: Item List -->
      <div class="left-column">
        <div class="header">
          <h1>{{ title }}</h1>
          <button @click="showUploadPage = true" class="upload-btn">Upload {{ itemType }}</button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="loading" class="loading-text">Loading {{ itemType }}s...</div>
        <div v-if="!loading && items.length === 0" class="no-items-text">
          No {{ itemType }}s found.
        </div>
        <ul v-if="items.length > 0" class="item-list">
            <slot name="list-item" :items="items" :selectedItem="selectedItem" :selectItem="selectItem" :deleteItem="deleteItem"></slot>
        </ul>
      </div>

      <!-- Right Column: Viewer and Code Snippet -->
      <div class="right-column">
        <div v-if="selectedItem" class="viewer-section">
          <div class="viewer-container">
            <component :is="viewerComponent" v-bind="viewerProps" />
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
          <p>Select an {{ itemType }} from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { fetchItems as apiFetchItems, deleteItem as apiDeleteItem } from '@/lib/api';

const props = defineProps({
  title: String,
  itemType: String,
  fetchUrl: String,
  deleteUrlBase: String,
  viewerComponent: Object,
  uploadComponent: Object,
  codeSnippets: Object,
  transformData: Function,
  deleteItem: Function // Optional: for custom delete logic like in maps
});

const items = ref([]);
const selectedItem = ref(null);
const error = ref(null);
const loading = ref(true);
const showUploadPage = ref(false);
const selectedLanguage = ref('js'); // 'js' or 'unity'

const viewerProps = computed(() => {
    if(!selectedItem.value) return {};
    if (props.itemType === 'asset') return { assetUrl: selectedItem.value.url };
    if (props.itemType === 'map') return { mapLayer: selectedItem.value };
    if (props.itemType === 'tileset') return { tilesetUrl: selectedItem.value.url };
    return {};
});

const currentCodeSnippet = computed(() => {
    if (!selectedItem.value) return '';
    const snippetGenerator = props.codeSnippets[selectedLanguage.value];
    return snippetGenerator ? snippetGenerator(selectedItem.value) : '';
});

const fetchItems = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await apiFetchItems(props.fetchUrl);
    const data = response.data;
    if (Array.isArray(data)) {
        items.value = props.transformData ? props.transformData(data) : data;
        if (items.value.length > 0) {
            selectedItem.value = items.value[0];
        }
    } else {
        items.value = [];
    }
  } catch (err) {
    console.error(`Error fetching ${props.itemType}s:`, err);
    error.value = `Failed to fetch ${props.itemType}s. Make sure the backend server is running.`;
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const handleItemUploaded = () => {
  showUploadPage.value = false;
  fetchItems();
};

const deleteItem = async (item) => {
    if (props.deleteItem) {
        await props.deleteItem(item);
        fetchItems(); // Refetch items after custom delete
        return;
    }
  try {
    await apiDeleteItem(props.deleteUrlBase, item);
    items.value = items.value.filter(i => i.url !== item.url);
    if (selectedItem.value && selectedItem.value.url === item.url) {
      selectedItem.value = items.value.length > 0 ? items.value[0] : null;
    }
  } catch (err) {
    console.error(`Error deleting ${props.itemType}:`, err);
    error.value = `Failed to delete ${props.itemType}.`;
  }
};

const selectItem = (item) => {
  selectedItem.value = item;
};

onMounted(fetchItems);
</script>

<style scoped>
.library-container {
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
h1 {
  color: #333;
}
.upload-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
}
.upload-btn:hover {
  background-color: #45a049;
}
.item-list {
  list-style: none;
  padding: 0;
}
.viewer-section {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.viewer-container {
    flex-grow: 1;
    background-color: #e0e0e0;
    margin-bottom: 20px;
}
.code-snippet-container {
    flex-shrink: 0;
}
.code-snippet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.language-selector button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  cursor: pointer;
  background-color: #f0f0f0;
}
.language-selector button.active {
  background-color: #ccc;
  font-weight: bold;
}
pre {
  background-color: #2d2d2d;
  color: #f1f1f1;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}
.placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}
.error {
    color: red;
}
.loading-text, .no-items-text {
    text-align: center;
    padding: 20px;
    color: #666;
}
</style> 