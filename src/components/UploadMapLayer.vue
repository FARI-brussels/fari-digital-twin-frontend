<script setup>
import { ref } from 'vue';
import { postItem } from '@/lib/api';

const emit = defineEmits(['uploaded', 'cancel']);
const url = ref('');
const layer = ref('');
const description = ref('');
const error = ref(null);
const successMessage = ref('');
const submitting = ref(false);

const addLayer = async () => {
  error.value = null;
  successMessage.value = '';
  submitting.value = true;
  try {
    await postItem('/maps-manager/add_layer', {
      layer: {
        url: url.value,
        layer: layer.value,
        description: description.value,
      }
    });
    successMessage.value = 'Map layer added successfully!';
    url.value = '';
    layer.value = '';
    description.value = '';
    setTimeout(() => {
      emit('uploaded');
    }, 1500);
  } catch (err) {
    console.error('Error adding map layer:', err);
    error.value = 'Failed to add map layer. Please check the details and try again.';
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="p-5 border rounded-lg bg-gray-50 max-w-lg mx-auto mt-5">
    <h2 class="text-center text-xl font-bold text-gray-800 mb-5">Add New Map Layer</h2>
    <form @submit.prevent="addLayer">
      <div class="mb-4">
        <label for="url" class="block font-bold mb-2">Provider URL:</label>
        <input type="url" id="url" v-model="url" placeholder="e.g., http://example.com/wms" required
          class="w-full px-2 py-1 border rounded" />
      </div>
      <div class="mb-4">
        <label for="layer" class="block font-bold mb-2">Layer Name/ID:</label>
        <input type="text" id="layer" v-model="layer" placeholder="e.g., MyLayerName" required
          class="w-full px-2 py-1 border rounded" />
      </div>
      <div class="mb-4">
        <label for="description" class="block font-bold mb-2">Description:</label>
        <textarea id="description" v-model="description" rows="3" required
          class="w-full px-2 py-1 border rounded"></textarea>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="submit" :disabled="submitting"
          class="px-4 py-2 rounded bg-green-600 text-white font-bold disabled:bg-green-300">{{ submitting ? 'Adding...'
            : 'Add Layer' }}</button>
        <button type="button" @click="$emit('cancel')"
          class="px-4 py-2 rounded bg-red-600 text-white font-bold">Cancel</button>
      </div>
      <div v-if="error" class="text-red-600 mt-4 text-center">{{ error }}</div>
      <div v-if="successMessage" class="text-green-600 mt-4 text-center">{{ successMessage }}</div>
    </form>
  </div>
</template>