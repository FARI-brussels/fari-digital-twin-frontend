<script setup lang="ts">
/**
 * UploadMapLayer - Form to add WMS map layers
 * Requires authentication to add layers
 */
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useAddMapLayerMutation } from '@/api';
import { Button } from '@/components/ui/button';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Layers, Plus, AlertCircle, CheckCircle2, Globe, Type, FileText } from 'lucide-vue-next';

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

const url = ref('');
const layer = ref('');
const description = ref('');
const successMessage = ref('');

// ============================================================================
// Mutation
// ============================================================================

const addLayerMutation = useAddMapLayerMutation();

const error = computed(() => {
  if (addLayerMutation.error.value) {
    return 'Failed to add map layer. Please check the details and try again.';
  }
  return null;
});

const submitting = computed(() => addLayerMutation.isPending.value);

// ============================================================================
// Methods
// ============================================================================

async function addLayer(): Promise<void> {
  if (!canWrite.value) return;

  successMessage.value = '';
  addLayerMutation.reset();

  try {
    await addLayerMutation.mutateAsync({
      url: url.value,
      layer: layer.value,
      description: description.value,
    });
    successMessage.value = 'Map layer added successfully!';
    url.value = '';
    layer.value = '';
    description.value = '';
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
      action="add map layers"
      title="Sign in to Add Layers"
      description="Create an account or sign in to add WMS map layers to the library."
    />

    <!-- Add layer form (authenticated) -->
    <div v-else class="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 bg-gradient-to-r from-secondary/10 to-accent/10 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Layers class="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-foreground">Add New Map Layer</h2>
            <p class="text-sm text-muted-foreground">Connect a WMS service to display geospatial data</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form class="p-6 space-y-5" @submit.prevent="addLayer">
        <!-- WMS URL -->
        <div class="space-y-2">
          <label for="url" class="flex items-center gap-2 text-sm font-medium text-foreground">
            <Globe class="w-4 h-4 text-muted-foreground" />
            WMS Provider URL
          </label>
          <input
            id="url"
            v-model="url"
            type="url"
            placeholder="https://example.com/wms"
            required
            class="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
          />
          <p class="text-xs text-muted-foreground">
            The base URL of the WMS service (without query parameters)
          </p>
        </div>

        <!-- Layer Name -->
        <div class="space-y-2">
          <label for="layer" class="flex items-center gap-2 text-sm font-medium text-foreground">
            <Type class="w-4 h-4 text-muted-foreground" />
            Layer Name/ID
          </label>
          <input
            id="layer"
            v-model="layer"
            type="text"
            placeholder="layer_name"
            required
            class="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
          />
          <p class="text-xs text-muted-foreground">
            The exact layer name as defined in the WMS GetCapabilities
          </p>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label for="description" class="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText class="w-4 h-4 text-muted-foreground" />
            Description
          </label>
          <textarea
            id="description"
            v-model="description"
            rows="3"
            required
            placeholder="Describe this map layer..."
            class="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors resize-none"
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
            :disabled="!url || !layer || !description || submitting"
            class="bg-secondary hover:bg-secondary/90"
          >
            <Plus class="w-4 h-4 mr-2" />
            {{ submitting ? 'Adding...' : 'Add Layer' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
