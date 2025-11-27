<script setup lang="ts">
import { ref, onMounted, computed, type Component } from 'vue';
import { fetchItems as apiFetchItems, deleteItem as apiDeleteItem } from '@/lib/api';
import type { AxiosResponse } from 'axios';
import type { ItemType, CodeLanguage, LibraryItem } from '@/types';

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  title: string;
  itemType: ItemType;
  fetchUrl?: string;
  deleteUrlBase?: string;
  viewerComponent: Component;
  uploadComponent?: Component;
  codeSnippets: Partial<Record<CodeLanguage, (item: LibraryItem) => string>>;
  transformData?: (data: unknown[]) => LibraryItem[];
  deleteItem?: (item: LibraryItem) => Promise<void>;
  staticItems?: LibraryItem[];
  customFetch?: () => Promise<AxiosResponse<LibraryItem[]>>;
}

const props = defineProps<Props>();

// ============================================================================
// State
// ============================================================================

const items = ref<LibraryItem[]>([]);
const selectedItem = ref<LibraryItem | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);
const showUploadPage = ref(false);
const selectedLanguage = ref<CodeLanguage>('js');

// ============================================================================
// Computed
// ============================================================================

const viewerProps = computed<Record<string, unknown>>(() => {
  if (!selectedItem.value) return {};

  switch (props.itemType) {
    case 'asset':
      return { assetUrl: selectedItem.value.url };
    case 'map':
      return { mapLayer: selectedItem.value };
    case 'tileset':
      return { tilesetUrl: selectedItem.value.url };
    case 'dataset':
      return { dataset: selectedItem.value };
    default:
      return {};
  }
});

const currentCodeSnippet = computed<string>(() => {
  if (!selectedItem.value) return '';
  const snippetGenerator = props.codeSnippets[selectedLanguage.value];
  return snippetGenerator ? snippetGenerator(selectedItem.value) : '';
});

const languageLabel = computed(() => {
  return (lang: string): string => {
    switch (lang) {
      case 'js':
        return 'JavaScript';
      case 'unity':
        return 'Cesium Unity';
      case 'react':
        return 'React';
      default:
        return lang;
    }
  };
});

// ============================================================================
// Methods
// ============================================================================

async function fetchItemsData(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    // Use static items if provided
    if (props.staticItems) {
      items.value = props.staticItems;
      if (items.value.length > 0) {
        selectedItem.value = items.value[0] ?? null;
      }
      loading.value = false;
      return;
    }

    // Use custom fetch function if provided
    if (props.customFetch) {
      const response = await props.customFetch();
      const data = response.data;
      if (Array.isArray(data)) {
        items.value = props.transformData ? props.transformData(data) : data;
        if (items.value.length > 0) {
          selectedItem.value = items.value[0] ?? null;
        }
      } else {
        items.value = [];
      }
      loading.value = false;
      return;
    }

    // Default API fetch
    if (!props.fetchUrl) {
      throw new Error('No fetchUrl provided and no static items or custom fetch');
    }

    const response = await apiFetchItems<LibraryItem>(props.fetchUrl);
    const data = response.data;
    if (Array.isArray(data)) {
      items.value = props.transformData ? props.transformData(data) : data;
      if (items.value.length > 0) {
        selectedItem.value = items.value[0] ?? null;
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
}

function handleItemUploaded(): void {
  showUploadPage.value = false;
  void fetchItemsData();
}

async function handleDeleteItem(item: LibraryItem): Promise<void> {
  if (props.deleteItem) {
    await props.deleteItem(item);
    void fetchItemsData();
    return;
  }

  if (!props.deleteUrlBase) {
    console.error('No deleteUrlBase provided');
    return;
  }

  if (!item.url) {
    console.error('Item has no URL for deletion');
    return;
  }

  try {
    await apiDeleteItem(props.deleteUrlBase, { url: item.url });
    items.value = items.value.filter(i => i.url !== item.url);
    if (selectedItem.value?.url === item.url) {
      selectedItem.value = items.value.length > 0 ? (items.value[0] ?? null) : null;
    }
  } catch (err) {
    console.error(`Error deleting ${props.itemType}:`, err);
    error.value = `Failed to delete ${props.itemType}.`;
  }
}

function selectItem(item: LibraryItem): void {
  selectedItem.value = item;
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  void fetchItemsData();
});
</script>

<template>
  <div class="h-full flex">
    <component
      :is="uploadComponent"
      v-if="showUploadPage && uploadComponent"
      @uploaded="handleItemUploaded"
      @cancel="showUploadPage = false"
    />
    <div v-else class="flex w-full h-full">
      <!-- Sidebar -->
      <div class="w-2/5 p-5 border-r border-gray-300 overflow-y-auto bg-gray-50">
        <div class="flex justify-between items-center mb-5">
          <h1 class="text-gray-800 text-xl font-bold">{{ title }}</h1>
          <button
            v-if="uploadComponent"
            class="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            @click="showUploadPage = true"
          >
            Upload {{ itemType }}
          </button>
        </div>
        <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
        <div v-if="loading" class="text-center py-5 text-gray-500">Loading {{ itemType }}s...</div>
        <div v-if="!loading && items.length === 0" class="text-center py-5 text-gray-400">
          No {{ itemType }}s found.
        </div>
        <ul v-if="items.length > 0">
          <slot
            name="list-item"
            :items="items"
            :selected-item="selectedItem"
            :select-item="selectItem"
            :delete-item="handleDeleteItem"
          />
        </ul>
      </div>

      <!-- Main Content -->
      <div class="w-3/5 p-5 flex flex-col overflow-hidden">
        <div v-if="selectedItem" class="flex flex-col h-full overflow-hidden">
          <!-- Viewer -->
          <div class="bg-gray-200 mb-5 flex-[3] min-h-0">
            <component :is="viewerComponent" v-bind="viewerProps" />
          </div>

          <!-- Code Snippets -->
          <div class="flex-[2] flex flex-col min-h-0 overflow-hidden">
            <div class="flex justify-between items-center mb-2 flex-shrink-0">
              <h3 class="font-bold">Code Example</h3>
              <div>
                <button
                  v-for="(_, lang) in codeSnippets"
                  :key="lang"
                  :class="[
                    'px-2 py-1 border rounded mr-2',
                    selectedLanguage === lang ? 'bg-gray-300 font-bold' : 'bg-gray-100',
                  ]"
                  @click="selectedLanguage = lang as CodeLanguage"
                >
                  {{ languageLabel(lang) }}
                </button>
              </div>
            </div>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-auto flex-1 min-h-0"><code>{{ currentCodeSnippet }}</code></pre>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex items-center justify-center h-full text-gray-400">
          <p>Select an {{ itemType }} from the list to visualize it and get the integration code.</p>
        </div>
      </div>
    </div>
  </div>
</template>
