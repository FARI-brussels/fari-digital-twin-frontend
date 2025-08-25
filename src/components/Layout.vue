<template>
  <div>
    <Header />
    <main class="w-full">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'
</script>
