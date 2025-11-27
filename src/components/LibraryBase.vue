<script setup lang="ts">
import { ref, computed, watch, type Component, type Ref } from 'vue';
import type { ItemType, CodeLanguage, LibraryItem } from '@/types';

// ============================================================================
// Props Definition
// ============================================================================

interface Props {
  title: string;
  itemType: ItemType;
  viewerComponent: Component;
  uploadComponent?: Component;
  codeSnippets: Partial<Record<CodeLanguage, (item: LibraryItem) => string>>;
  // TanStack Query integration
  items: LibraryItem[];
  isLoading: boolean;
  error: Error | null;
  // Optional callbacks for mutations
  onDelete?: (item: LibraryItem) => Promise<void>;
  // For static items (like realtime datasets)
  staticItems?: LibraryItem[];
}

const props = defineProps<Props>();

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  uploaded: [];
}>();

// ============================================================================
// State
// ============================================================================

const selectedItem = ref<LibraryItem | null>(null) as Ref<LibraryItem | null>;
const showUploadPage = ref(false);
const selectedLanguage = ref<CodeLanguage>('js');
const deleteError = ref<string | null>(null);

// ============================================================================
// Computed
// ============================================================================

const displayItems = computed(() => {
  if (props.staticItems && props.staticItems.length > 0) {
    return props.staticItems;
  }
  return props.items;
});

const displayLoading = computed(() => {
  if (props.staticItems) return false;
  return props.isLoading;
});

const displayError = computed(() => {
  if (deleteError.value) return deleteError.value;
  if (props.error) {
    return `Failed to fetch ${props.itemType}s. Make sure the backend server is running.`;
  }
  return null;
});

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
// Watchers
// ============================================================================

// Auto-select first item when items load
watch(
  displayItems,
  newItems => {
    if (newItems.length > 0 && !selectedItem.value) {
      selectedItem.value = newItems[0] ?? null;
    }
  },
  { immediate: true }
);

// ============================================================================
// Methods
// ============================================================================

function handleItemUploaded(): void {
  showUploadPage.value = false;
  emit('uploaded');
}

async function handleDeleteItem(item: LibraryItem): Promise<void> {
  if (!props.onDelete) {
    console.error('No delete handler provided');
    return;
  }

  deleteError.value = null;

  try {
    await props.onDelete(item);
    // If deleted item was selected, select first available
    if (selectedItem.value?.url === item.url || selectedItem.value?.id === item.id) {
      const remaining = displayItems.value.filter(
        i => i.url !== item.url && i.id !== item.id
      );
      selectedItem.value = remaining.length > 0 ? (remaining[0] ?? null) : null;
    }
  } catch (err) {
    console.error(`Error deleting ${props.itemType}:`, err);
    deleteError.value = `Failed to delete ${props.itemType}.`;
  }
}

function selectItem(item: LibraryItem): void {
  selectedItem.value = item;
}
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
        <div v-if="displayError" class="text-red-600 mb-2">{{ displayError }}</div>
        <div v-if="displayLoading" class="text-center py-5 text-gray-500">
          Loading {{ itemType }}s...
        </div>
        <div
          v-if="!displayLoading && displayItems.length === 0"
          class="text-center py-5 text-gray-400"
        >
          No {{ itemType }}s found.
        </div>
        <ul v-if="displayItems.length > 0">
          <slot
            name="list-item"
            :items="displayItems"
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
            <pre
              class="bg-gray-900 text-gray-100 p-4 rounded overflow-auto flex-1 min-h-0"
            ><code>{{ currentCodeSnippet }}</code></pre>
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
