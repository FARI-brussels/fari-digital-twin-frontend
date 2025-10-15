<script setup>
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useKeycloak } from '@josempgon/vue-keycloak';

const router = useRouter();
const { isPending, isAuthenticated, hasFailed } = useKeycloak();

const navigateHome = () => {
  router.replace({ name: 'Home' });
};

if (!isPending.value) {
  navigateHome();
}

watch(isPending, (pending) => {
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
