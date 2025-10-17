<script setup>
import RealtimeViewer from '@/components/RealtimeViewer.vue';
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="bg-white border-b px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-900">Realtime Data</h1>
      <p class="text-sm text-gray-600 mt-1">
        Live positions of STIB vehicles in Brussels (Metro, Tram, Bus)
      </p>
    </div>

    <!-- Viewer -->
    <div class="flex-1 relative">
      <RealtimeViewer class="absolute inset-0" />
    </div>
  </div>
</template>
