<script setup lang="ts">
/**
 * LibraryBase - Reusable library layout component
 * Handles item listing, selection, viewing, and code snippets
 * Authentication-aware: hides upload/delete when not authenticated
 */
import { ref, computed, watch, type Component, type Ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Button } from '@/components/ui/button';
import LoginPrompt from '@/components/LoginPrompt.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { ItemType, CodeLanguage, LibraryItem } from '@/types';
import { Plus, Code, Copy, Check } from 'lucide-vue-next';

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
// Auth
// ============================================================================

const { isAuthenticated, canWrite } = useAuth();

// ============================================================================
// State
// ============================================================================

const selectedItem = ref<LibraryItem | null>(null) as Ref<LibraryItem | null>;
const showUploadPage = ref(false);
const selectedLanguage = ref<CodeLanguage>('js');
const deleteError = ref<string | null>(null);
const copiedCode = ref(false);

// Delete confirmation state
const showDeleteConfirm = ref(false);
const itemToDelete = ref<LibraryItem | null>(null);
const isDeleting = ref(false);

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

/** Can show upload button: has component and user can write */
const canUpload = computed(() => {
  return props.uploadComponent && canWrite.value;
});

/** Can delete items: has handler and user can write */
const canDelete = computed(() => {
  return props.onDelete && canWrite.value;
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

/** Opens the confirmation dialog for deleting an item */
function requestDeleteItem(item: LibraryItem): void {
  if (!props.onDelete || !canWrite.value) {
    console.error('No delete handler provided or not authorized');
    return;
  }
  itemToDelete.value = item;
  showDeleteConfirm.value = true;
}

/** Actually performs the delete after confirmation */
async function confirmDeleteItem(): Promise<void> {
  if (!props.onDelete || !itemToDelete.value) return;

  deleteError.value = null;
  isDeleting.value = true;

  try {
    await props.onDelete(itemToDelete.value);
    // If deleted item was selected, select first available
    if (selectedItem.value?.url === itemToDelete.value.url || selectedItem.value?.id === itemToDelete.value.id) {
      const remaining = displayItems.value.filter(
        i => i.url !== itemToDelete.value?.url && i.id !== itemToDelete.value?.id
      );
      selectedItem.value = remaining.length > 0 ? (remaining[0] ?? null) : null;
    }
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
  } catch (err) {
    console.error(`Error deleting ${props.itemType}:`, err);
    deleteError.value = `Failed to delete ${props.itemType}.`;
  } finally {
    isDeleting.value = false;
  }
}

/** Cancels the delete operation */
function cancelDelete(): void {
  showDeleteConfirm.value = false;
  itemToDelete.value = null;
}

function selectItem(item: LibraryItem): void {
  selectedItem.value = item;
}

async function copyCode(): Promise<void> {
  if (!currentCodeSnippet.value) return;
  try {
    await navigator.clipboard.writeText(currentCodeSnippet.value);
    copiedCode.value = true;
    setTimeout(() => {
      copiedCode.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
}
</script>

<template>
  <div class="h-full flex">
    <!-- Upload Page (full width takeover) -->
    <component
      :is="uploadComponent"
      v-if="showUploadPage && uploadComponent"
      @uploaded="handleItemUploaded"
      @cancel="showUploadPage = false"
    />

    <!-- Main Library View -->
    <div v-else class="flex w-full h-full">
      <!-- Sidebar -->
      <div class="w-2/5 flex flex-col border-r border-border bg-card">
        <!-- Header -->
        <div class="px-5 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-muted/30">
          <div class="flex justify-between items-center">
            <h1 class="text-foreground text-xl font-bold">{{ title }}</h1>

            <!-- Upload button (authenticated only) -->
            <Button
              v-if="canUpload"
              variant="default"
              size="sm"
              class="bg-primary hover:bg-primary/90"
              @click="showUploadPage = true"
            >
              <Plus class="w-4 h-4 mr-1" />
              Add {{ itemType }}
            </Button>

            <!-- Login prompt for unauthenticated users -->
            <LoginPrompt
              v-else-if="uploadComponent && !isAuthenticated"
              compact
              :action="`add ${itemType}s`"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="displayError" class="px-5 py-3 bg-destructive/10 border-b border-destructive/20">
          <p class="text-sm text-destructive">{{ displayError }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="displayLoading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-muted-foreground">Loading {{ itemType }}s...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="displayItems.length === 0"
          class="flex-1 flex items-center justify-center p-5"
        >
          <div class="text-center">
            <p class="text-muted-foreground mb-2">No {{ itemType }}s found.</p>
            <p v-if="uploadComponent && !isAuthenticated" class="text-sm text-muted-foreground">
              Sign in to add your first {{ itemType }}.
            </p>
          </div>
        </div>

        <!-- Items List -->
        <div v-else class="flex-1 overflow-y-auto">
          <ul>
            <slot
              name="list-item"
              :items="displayItems"
              :selected-item="selectedItem"
              :select-item="selectItem"
              :delete-item="requestDeleteItem"
              :can-delete="canDelete"
              :is-authenticated="isAuthenticated"
            />
          </ul>
        </div>
      </div>

      <!-- Main Content -->
      <div class="w-3/5 p-5 flex flex-col overflow-hidden bg-background">
        <div v-if="selectedItem" class="flex flex-col h-full overflow-hidden">
          <!-- Viewer -->
          <div class="bg-muted rounded-lg mb-5 flex-[3] min-h-0 overflow-hidden">
            <component :is="viewerComponent" v-bind="viewerProps" />
          </div>

          <!-- Code Snippets -->
          <div class="flex-[2] flex flex-col min-h-0 overflow-hidden">
            <div class="flex justify-between items-center mb-3 flex-shrink-0">
              <div class="flex items-center gap-2">
                <Code class="w-5 h-5 text-muted-foreground" />
                <h3 class="font-semibold text-foreground">Integration Code</h3>
              </div>
              <div class="flex items-center gap-2">
                <!-- Language tabs -->
                <div class="flex bg-muted rounded-lg p-1">
                  <button
                    v-for="(_, lang) in codeSnippets"
                    :key="lang"
                    :class="[
                      'px-3 py-1.5 text-sm rounded-md transition-colors',
                      selectedLanguage === lang
                        ? 'bg-background text-foreground shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                    @click="selectedLanguage = lang as CodeLanguage"
                  >
                    {{ languageLabel(lang) }}
                  </button>
                </div>
                <!-- Copy button -->
                <Button
                  variant="outline"
                  size="sm"
                  class="gap-1"
                  @click="copyCode"
                >
                  <Check v-if="copiedCode" class="w-4 h-4 text-accent" />
                  <Copy v-else class="w-4 h-4" />
                  {{ copiedCode ? 'Copied!' : 'Copy' }}
                </Button>
              </div>
            </div>
            <pre
              class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto flex-1 min-h-0 text-sm font-mono"
            ><code>{{ currentCodeSnippet }}</code></pre>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Code class="w-8 h-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">
              Select an {{ itemType }} from the list to visualize it and get the integration code.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Delete Confirmation Dialog -->
  <ConfirmDialog
    v-model:open="showDeleteConfirm"
    title="Delete Item"
    :description="`Are you sure you want to delete '${itemToDelete?.name || itemToDelete?.url || 'this item'}'? This action cannot be undone.`"
    confirm-text="Delete"
    cancel-text="Cancel"
    variant="danger"
    :loading="isDeleting"
    @confirm="confirmDeleteItem"
    @cancel="cancelDelete"
  />
</template>
