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
  if (!selectedItem.value) return {};
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

<template>
  <div class="h-screen flex">
    <component :is="uploadComponent" v-if="showUploadPage" @uploaded="handleItemUploaded"
      @cancel="showUploadPage = false" />
    <div v-else class="flex w-full">
      <div class="w-2/5 p-5 border-r border-gray-300 overflow-y-auto bg-gray-50">
        <div class="flex justify-between items-center mb-5">
          <h1 class="text-gray-800 text-xl font-bold">{{ title }}</h1>
          <button @click="showUploadPage = true"
            class="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">Upload {{ itemType }}</button>
        </div>
        <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
        <div v-if="loading" class="text-center py-5 text-gray-500">Loading {{ itemType }}s...</div>
        <div v-if="!loading && items.length === 0" class="text-center py-5 text-gray-400">No {{ itemType }}s found.
        </div>
        <ul v-if="items.length > 0">
          <slot name="list-item" :items="items" :selectedItem="selectedItem" :selectItem="selectItem"
            :deleteItem="deleteItem"></slot>
        </ul>
      </div>
      <div class="w-3/5 p-5 flex flex-col">
        <div v-if="selectedItem" class="flex flex-col h-full">
          <div class="flex-grow bg-gray-200 mb-5">
            <component :is="viewerComponent" v-bind="viewerProps" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold">Code Example</h3>
              <div>
                <button
                  :class="['px-2 py-1 border rounded mr-2', selectedLanguage === 'js' ? 'bg-gray-300 font-bold' : 'bg-gray-100']"
                  @click="selectedLanguage = 'js'">CesiumJS</button>
                <button
                  :class="['px-2 py-1 border rounded', selectedLanguage === 'unity' ? 'bg-gray-300 font-bold' : 'bg-gray-100']"
                  @click="selectedLanguage = 'unity'">Cesium Unity</button>
              </div>
            </div>
            <pre
              class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>{{ currentCodeSnippet }}</code></pre>
          </div>
        </div>
        <div v-else class="flex items-center justify-center h-full text-gray-400">
          <p>Select an {{ itemType }} from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>