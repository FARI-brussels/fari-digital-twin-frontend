<script setup lang="ts">

import Header from "./Header.vue";
</script>

<template>
  <div>
      <Header />
    <main>
      <slot/>
    </main>
  </div>

</template>

<style scoped>

</style>