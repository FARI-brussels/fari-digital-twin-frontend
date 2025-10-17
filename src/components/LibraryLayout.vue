<script setup>
</script>

<template>
  <div class="flex flex-col h-screen">
    <nav class="bg-gray-800 py-4 px-8 flex justify-center gap-8 shadow">
      <router-link to="/library/assets" class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700">3D Asset Library</router-link>
      <router-link to="/library/maps" class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700">Map Library</router-link>
      <router-link to="/library/tilesets" class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700">Tileset Library</router-link>
      <router-link to="/library/realtime" class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
                   active-class="bg-gray-700">Realtime Data</router-link>
      <router-link to="/library/demo" class="text-white font-bold text-lg px-3 py-1 rounded hover:bg-gray-700"
        active-class="bg-gray-700">Demo</router-link>
    </nav>
    <div class="flex-1 overflow-hidden">
      <router-view />
    </div>
  </div>
</template>