<script setup lang="ts">

import {Button} from "@/components/ui/button";
import FariLogo from "@/assets/FariLogo.vue";
</script>

<template>
  <div class="flex flex-row w-full items-center justify-between py-4 px-25 text-white bg-[#2250c6]">
    <router-link to="/">
      <FariLogo/>

    </router-link>
    <div class="flex gap-2">
      <Button variant="ghost" as-child class="text-white hover:bg-white/10 hover:text-white">
        <RouterLink to="/doc">
          API doc
        </RouterLink>
      </Button>
      <Button variant="secondary" as-child class="bg-white text-blue-800 hover:bg-gray-100">
        <RouterLink to="/signin">
          Sign in
        </RouterLink>
      </Button>
    </div>
  </div>
</template>

<style scoped>

</style>