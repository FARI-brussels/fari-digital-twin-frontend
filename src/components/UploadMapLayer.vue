<script setup lang="ts">
/**
 * UploadMapLayer - Form to add WMS map layers
 * Requires authentication to add layers
 */
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useAddMapLayerMutation } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import LoginPrompt from '@/components/LoginPrompt.vue';
import { Layers, Plus, AlertCircle, CheckCircle2 } from 'lucide-vue-next';

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
  <div class="w-full">
    <!-- Auth check -->
    <LoginPrompt
      v-if="!isAuthenticated"
      action="add map layers"
      title="Sign in to Add Layers"
      description="Create an account or sign in to add WMS map layers to the library."
    />

    <!-- Add layer form (authenticated) -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
          <Layers class="h-5 w-5 text-secondary" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">Add New Map Layer</h2>
          <p class="text-sm text-muted-foreground">Connect a WMS service to display geospatial data</p>
        </div>
      </div>

      <Separator class="my-4" />

      <form class="space-y-5" @submit.prevent="addLayer">
        <!-- WMS URL -->
        <div class="space-y-2">
          <Label for="wms-url">
            WMS Provider URL <span class="text-destructive">*</span>
          </Label>
          <Input
            id="wms-url"
            v-model="url"
            type="url"
            placeholder="https://example.com/wms"
            required
          />
          <p class="text-xs text-muted-foreground">
            The base URL of the WMS service (without query parameters)
          </p>
        </div>

        <!-- Layer Name -->
        <div class="space-y-2">
          <Label for="layer-name">
            Layer Name/ID <span class="text-destructive">*</span>
          </Label>
          <Input
            id="layer-name"
            v-model="layer"
            type="text"
            placeholder="layer_name"
            required
          />
          <p class="text-xs text-muted-foreground">
            The exact layer name as defined in the WMS GetCapabilities
          </p>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="layer-description">
            Description <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="layer-description"
            v-model="description"
            placeholder="Describe this map layer..."
            required
          />
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive"
        >
          <AlertCircle class="h-5 w-5 flex-shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/10 px-4 py-3 text-secondary-foreground"
        >
          <CheckCircle2 class="h-5 w-5 flex-shrink-0 text-secondary" />
          <span class="text-sm">{{ successMessage }}</span>
        </div>

        <Separator />

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button type="button" variant="outline" @click="handleCancel">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!url || !layer || !description || submitting"
          >
            <Plus class="mr-2 h-4 w-4" />
            {{ submitting ? 'Adding...' : 'Add Layer' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
