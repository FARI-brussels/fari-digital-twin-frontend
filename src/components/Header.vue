<template>
  <div class="flex w-full flex-row items-center justify-between px-25 py-4">

    <router-link to="/">
      <p class="font-sans text-2xl font-semibold">FARI Digital Twin Brussels</p>
    </router-link>

    <div class="flex gap-2">
      <Button variant="link" as-child>
        <RouterLink to="/doc"> API doc </RouterLink>
      </Button>
      <Button variant="default">Sign in</Button>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>
