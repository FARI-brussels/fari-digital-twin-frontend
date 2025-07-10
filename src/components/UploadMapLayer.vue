<template>
  <div class="upload-form">
    <h2>Add New Map Layer</h2>
    <form @submit.prevent="addLayer">
      <div class="form-group">
        <label for="url">Provider URL:</label>
        <input type="url" id="url" v-model="url" placeholder="e.g., http://example.com/wms" required>
      </div>
      <div class="form-group">
        <label for="layer">Layer Name/ID:</label>
        <input type="text" id="layer" v-model="layer" placeholder="e.g., MyLayerName" required>
      </div>
      <div class="form-group">
        <label for="description">Description:</label>
        <textarea id="description" v-model="description" rows="3" required></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Adding...' : 'Add Layer' }}
        </button>
        <button type="button" @click="$emit('cancel')" class="cancel-btn">Cancel</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="successMessage" class="success">{{ successMessage }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

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
    await axios.post(import.meta.env.VITE_BACKEND_URL + '/maps-manager/add_layer', {
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

<style scoped>
.upload-form {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  max-width: 500px;
  margin: 20px auto;
}
h2 {
  text-align: center;
  color: #333;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  font-weight: bold;
}
button:disabled {
  background-color: #a5d6b8;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background-color: #369f77;
}
.cancel-btn {
    background-color: #f44336;
}
.cancel-btn:hover:not(:disabled) {
    background-color: #d32f2f;
}
.error {
  color: red;
  margin-top: 15px;
  text-align: center;
}
.success {
  color: green;
  margin-top: 15px;
  text-align: center;
}
</style> 