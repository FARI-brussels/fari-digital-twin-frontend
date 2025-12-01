<script setup lang="ts">
import LibraryBase from '@/components/LibraryBase.vue';
import RealtimeViewer from '@/components/RealtimeViewer.vue';
import { MobilityEndpoints } from '@/api/mobilityClient';
import type { RealtimeDataset, LibraryItem } from '@/types';

// Transform the endpoints configuration into the list of "datasets"
// Each endpoint becomes an item in the sidebar list
const realtimeDatasets: RealtimeDataset[] = Object.keys(MobilityEndpoints).map((key) => ({
  id: key, // Matches the key in MobilityEndpoints
  name: formatName(key),
  description: `Real-time data for ${formatName(key)}`,
  type: 'realtime',
  endpoint: MobilityEndpoints[key as keyof typeof MobilityEndpoints],
}));


function formatName(key: string): string {
  // Convert camelCase to Title Case
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Define code snippets generation
const codeSnippets = {
  js: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    return `// Fetch ${dataset.name} data
import { fetchMobilityData } from '@/api/mobilityClient';

async function getData() {
  const response = await fetchMobilityData('${dataset.id}');
  console.log(response.data);
}`;
  },
  react: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    return `// React Hook for ${dataset.name}
import { useState, useEffect } from 'react';
import { fetchMobilityData } from '@/api/mobilityClient';

export function use${dataset.name.replace(/\s/g, '')}() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMobilityData('${dataset.id}').then(setData);
  }, []);

  return data;
}`;
  },
  unity: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    return `// Unity C# Example
// Endpoint: https://api.mobilitytwin.brussels${dataset.endpoint}
// Ensure you add the Authorization header with your token`;
  }
};


// We don't need upload/delete for these system-defined endpoints
</script>

<template>
  <LibraryBase
    title="Realtime Data"
    item-type="dataset"
    :viewer-component="RealtimeViewer"
    :code-snippets="codeSnippets"
    :items="[]"
    :is-loading="false"
    :error="null"
    :static-items="realtimeDatasets"
  >
    <template #list-item="{ items, selectedItem, selectItem }">
      <li
        v-for="item in items"
        :key="item.id"
        :class="[
          'p-3 mb-2 rounded cursor-pointer transition-colors border border-gray-200 hover:bg-gray-100',
          selectedItem?.id === item.id ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white',
        ]"
        @click="selectItem(item)"
      >
        <div class="font-bold text-gray-800">{{ item.name }}</div>
        <div class="text-sm text-gray-600 mt-1 line-clamp-2">{{ item.description }}</div>
        <div class="text-xs text-gray-400 mt-2 font-mono bg-gray-100 inline-block px-1 rounded">
          {{ (item as any).id }}
        </div>
      </li>
    </template>
  </LibraryBase>
</template>

