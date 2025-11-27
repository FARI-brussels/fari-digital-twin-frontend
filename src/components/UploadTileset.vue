<script setup lang="ts">
import { ref } from 'vue';
import { uploadItem } from '@/lib/api';
import type { Tileset } from '@/types';

// ============================================================================
// Emits
// ============================================================================

const emit = defineEmits<{
  uploaded: [];
  cancel: [];
}>();

// ============================================================================
// State
// ============================================================================

const file = ref<File | null>(null);
const description = ref('');
const error = ref<string | null>(null);
const successMessage = ref('');
const uploading = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);

// ============================================================================
// Methods
// ============================================================================

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
  successMessage.value = '';
  error.value = null;
}

async function uploadTileset(): Promise<void> {
  if (!file.value || !description.value) {
    error.value = 'File and description are required.';
    return;
  }

  const formData = new FormData();
  formData.append('zip_file', file.value);
  formData.append('description', description.value);

  error.value = null;
  successMessage.value = '';
  uploading.value = true;

  try {
    await uploadItem<Tileset>('/tileset-manager/upload', formData);
    successMessage.value = 'Tileset uploaded successfully!';
    description.value = '';

    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
    file.value = null;

    setTimeout(() => {
      emit('uploaded');
    }, 1500);
  } catch (err) {
    console.error('Error uploading tileset:', err);
    error.value = 'Failed to upload tileset. Please try again.';
  } finally {
    uploading.value = false;
  }
}

function handleCancel(): void {
  emit('cancel');
}
</script>

<template>
  <div class="p-5 border rounded-lg bg-gray-50 max-w-lg mx-auto mt-5">
    <h2 class="text-center text-xl font-bold text-gray-800 mb-5">Upload New Tileset</h2>
    <form @submit.prevent="uploadTileset">
      <div class="mb-4">
        <label for="file" class="block font-bold mb-2">Tileset File (must be a .zip):</label>
        <input
          ref="fileInputRef"
          type="file"
          id="file"
          @change="handleFileChange"
          required
          accept=".zip"
          class="w-full px-2 py-1 border rounded"
        />
      </div>
      <div class="mb-4">
        <label for="description" class="block font-bold mb-2">Description:</label>
        <textarea
          id="description"
          v-model="description"
          rows="3"
          required
          class="w-full px-2 py-1 border rounded"
        ></textarea>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button
          type="submit"
          :disabled="!file || !description || uploading"
          class="px-4 py-2 rounded bg-green-600 text-white font-bold disabled:bg-green-300"
        >
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 rounded bg-red-600 text-white font-bold"
        >
          Cancel
        </button>
      </div>
      <div v-if="error" class="text-red-600 mt-4 text-center">{{ error }}</div>
      <div v-if="successMessage" class="text-green-600 mt-4 text-center">{{ successMessage }}</div>
    </form>
  </div>
</template>
