<script setup lang="ts">
// Library layout with navigation tabs
</script>

<template>
  <div class="flex flex-col h-screen">
    <nav class="bg-gray-800 py-4 px-8 flex justify-center gap-8 shadow">
      <RouterLink
        to="/library/assets"
        class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700"
      >
        3D Asset Library
      </RouterLink>
      <RouterLink
        to="/library/maps"
        class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700"
      >
        Map Library
      </RouterLink>
      <RouterLink
        to="/library/tilesets"
        class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700"
      >
        Tileset Library
      </RouterLink>
      <RouterLink
        to="/library/realtime"
        class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700"
      >
        Realtime Data
      </RouterLink>
      <RouterLink
        to="/library/demo"
        class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700"
      >
        Demo
      </RouterLink>
    </nav>
    <div class="flex-1 overflow-hidden">
      <RouterView />
    </div>
  </div>
</template>
