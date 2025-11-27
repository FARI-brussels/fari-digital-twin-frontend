<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useKeycloak } from '@josempgon/vue-keycloak';

// ============================================================================
// Composables
// ============================================================================

const router = useRouter();
const { isPending } = useKeycloak();

// ============================================================================
// Methods
// ============================================================================

function navigateHome(): void {
  void router.replace({ name: 'Home' });
}

// ============================================================================
// Navigation Logic
// ============================================================================

if (!isPending.value) {
  navigateHome();
}

watch(isPending, (pending: boolean) => {
  if (!pending) {
    navigateHome();
  }
});
</script>

<template>
  <div class="flex h-[60vh] w-full items-center justify-center">
    <p class="text-lg text-gray-600">Signing you in…</p>
  </div>
</template>
