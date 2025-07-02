<script setup lang="ts">

import {Button} from "@/components/ui/button";
</script>

<template>
  <div class="flex flex-row w-full items-center justify-between py-4 px-25">
    <router-link to="/">
    <p class="font-semibold text-2xl font-sans">FARI Digital Twin Brussels</p>

    </router-link>
    <div class="flex gap-2">
      <Button variant="link">API doc</Button>
      <Button variant="default">Sign in</Button>
    </div>
  </div>
</template>

<style scoped>

</style>