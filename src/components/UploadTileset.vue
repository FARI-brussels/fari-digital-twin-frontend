<script setup lang="ts">
/**
 * UploadTileset - Upload form for 3D Tilesets
 * Requires authentication to upload
 */
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useUploadTilesetMutation } from '@/api';
import { Button } from '@/components/ui/button';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Upload, FileArchive, X, CheckCircle2, AlertCircle, Building } from 'lucide-vue-next';

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  uploaded: [];
  cancel: [];
}>();

// ============================================================================
// Auth
// ============================================================================

const { isAuthenticated, canWrite } = useAuth();

// ============================================================================
// State
// ============================================================================

const file = ref<File | null>(null);
const description = ref('');
const successMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// ============================================================================
// Mutation
// ============================================================================

const uploadMutation = useUploadTilesetMutation();

const error = computed(() => {
  if (uploadMutation.error.value) {
    return 'Failed to upload tileset. Please try again.';
  }
  return null;
});

const uploading = computed(() => uploadMutation.isPending.value);

// ============================================================================
// Methods
// ============================================================================

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
  successMessage.value = '';
  uploadMutation.reset();
}

function handleDrop(event: DragEvent): void {
  isDragging.value = false;
  const droppedFile = event.dataTransfer?.files?.[0];
  if (droppedFile && droppedFile.name.endsWith('.zip')) {
    file.value = droppedFile;
    successMessage.value = '';
    uploadMutation.reset();
  }
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(): void {
  isDragging.value = false;
}

function clearFile(): void {
  file.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function uploadTileset(): Promise<void> {
  if (!file.value || !description.value || !canWrite.value) {
    return;
  }

  const formData = new FormData();
  formData.append('zip_file', file.value);
  formData.append('description', description.value);

  successMessage.value = '';

  try {
    await uploadMutation.mutateAsync(formData);
    successMessage.value = 'Tileset uploaded successfully!';
    description.value = '';
    clearFile();

    setTimeout(() => {
      emit('uploaded');
    }, 1500);
  } catch {
    // Error is handled by the mutation
  }
}

function handleCancel(): void {
  emit('cancel');
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto p-6">
    <!-- Auth check -->
    <LoginPrompt
      v-if="!isAuthenticated"
      action="upload tilesets"
      title="Sign in to Upload"
      description="Create an account or sign in to upload 3D tilesets to the library."
    />

    <!-- Upload form (authenticated) -->
    <div v-else class="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Building class="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-foreground">Upload New Tileset</h2>
            <p class="text-sm text-muted-foreground">Add a Cesium 3D Tileset to the library</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form class="p-6 space-y-6" @submit.prevent="uploadTileset">
        <!-- Drag & Drop Zone -->
        <div
          class="relative border-2 border-dashed rounded-lg transition-all duration-200"
          :class="[
            isDragging
              ? 'border-accent bg-accent/5'
              : file
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-accent/50 hover:bg-muted/50',
          ]"
          @drop.prevent="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".zip"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            @change="handleFileChange"
          />

          <div class="p-8 text-center">
            <template v-if="file">
              <div class="flex items-center justify-center gap-3">
                <FileArchive class="w-8 h-8 text-primary" />
                <div class="text-left">
                  <p class="font-medium text-foreground">{{ file.name }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ (file.size / 1024 / 1024).toFixed(2) }} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="ml-auto text-muted-foreground hover:text-destructive"
                  @click.stop="clearFile"
                >
                  <X class="w-4 h-4" />
                </Button>
              </div>
            </template>
            <template v-else>
              <FileArchive class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p class="text-foreground font-medium mb-1">
                Drop your tileset here or click to browse
              </p>
              <p class="text-sm text-muted-foreground">
                ZIP archive containing tileset.json and tile files
              </p>
            </template>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label for="description" class="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            id="description"
            v-model="description"
            rows="3"
            required
            placeholder="Describe your tileset..."
            class="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          ></textarea>
        </div>

        <!-- Messages -->
        <div
          v-if="error"
          class="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
        >
          <AlertCircle class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>

        <div
          v-if="successMessage"
          class="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/20 rounded-lg text-accent"
        >
          <CheckCircle2 class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm">{{ successMessage }}</span>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" @click="handleCancel">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!file || !description || uploading"
            class="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Upload class="w-4 h-4 mr-2" />
            {{ uploading ? 'Uploading...' : 'Upload Tileset' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
