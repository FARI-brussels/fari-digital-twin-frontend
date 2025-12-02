<script setup lang="ts">
// Library layout with navigation tabs
</script>

<template>
  <div class="flex flex-col h-screen">
    <nav class="bg-muted border-b border-border py-2 px-8 flex justify-center gap-2">
      <RouterLink
        to="/library/assets"
        class="text-muted-foreground font-medium px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
        active-class="!bg-accent !text-accent-foreground"
      >
        3D Asset Library
      </RouterLink>
      <RouterLink
        to="/library/maps"
        class="text-muted-foreground font-medium px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
        active-class="!bg-accent !text-accent-foreground"
      >
        Map Library
      </RouterLink>
      <RouterLink
        to="/library/tilesets"
        class="text-muted-foreground font-medium px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
        active-class="!bg-accent !text-accent-foreground"
      >
        Tileset Library
      </RouterLink>
      <RouterLink
        to="/library/realtime"
        class="text-muted-foreground font-medium px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
        active-class="!bg-accent !text-accent-foreground"
      >
        Realtime Data
      </RouterLink>
      <RouterLink
        to="/library/demo"
        class="text-muted-foreground font-medium px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
        active-class="!bg-accent !text-accent-foreground"
      >
        Demo
      </RouterLink>
    </nav>
    <div class="flex-1 overflow-hidden">
      <RouterView />
    </div>
  </div>
</template>
