<script setup lang="ts">
import LibraryBase from '@/components/LibraryBase.vue';
import RealtimeViewer from '@/components/RealtimeViewer.vue';
import { MobilityEndpoints } from '@/api/mobilityClient';
import { ComponentEndpoints } from '@/api/queries/components';
import type { RealtimeDataset, LibraryItem } from '@/types';

// Transform mobility endpoints into datasets
const mobilityDatasets: RealtimeDataset[] = Object.keys(MobilityEndpoints).map((key) => ({
  id: key,
  name: formatName(key),
  description: `Real-time data for ${formatName(key)}`,
  type: 'mobility',
  endpoint: MobilityEndpoints[key as keyof typeof MobilityEndpoints],
}));

// Transform backend component endpoints into datasets
const componentDatasets: RealtimeDataset[] = Object.keys(ComponentEndpoints).map((key) => ({
  id: key,
  name: formatName(key),
  description: `Backend component: ${formatName(key)}`,
  type: 'component',
  endpoint: ComponentEndpoints[key as keyof typeof ComponentEndpoints],
}));

// Combine all datasets
const realtimeDatasets: RealtimeDataset[] = [...mobilityDatasets, ...componentDatasets];

function formatName(key: string): string {
  // Convert camelCase to Title Case
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Helper to check source type
function isMobilitySource(id: string): boolean {
  return id in MobilityEndpoints;
}

// Define code snippets generation
const codeSnippets = {
  js: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
      return `// Fetch ${dataset.name} data from Mobility Twin API
import { fetchMobilityData } from '@/api/mobilityClient';

async function getData() {
  const response = await fetchMobilityData('${dataset.id}');
  console.log(response);
}`;
    }
    return `// Fetch ${dataset.name} data from Backend
import { apiClient, ComponentEndpoints } from '@/api';

async function getData() {
  const endpoint = ComponentEndpoints['${dataset.id}'];
  const response = await apiClient.get(endpoint).json();
  console.log(response);
}`;
  },
  react: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
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
    }
    return `// React Hook for ${dataset.name}
import { useState, useEffect } from 'react';
import { apiClient, ComponentEndpoints } from '@/api';

export function use${dataset.name.replace(/\s/g, '')}() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const endpoint = ComponentEndpoints['${dataset.id}'];
    apiClient.get(endpoint).json().then(setData);
  }, []);

  return data;
}`;
  },
  unity: (item: LibraryItem) => {
    const dataset = item as unknown as RealtimeDataset;
    if (isMobilitySource(dataset.id)) {
      return `// Unity C# Example - Mobility Twin API
// Endpoint: https://api.mobilitytwin.brussels${dataset.endpoint}
// Ensure you add the Authorization header with your Mobility Twin token`;
    }
    return `// Unity C# Example - Backend API
// Endpoint: {BACKEND_URL}/${dataset.endpoint}
// Ensure you add the Authorization header with your Keycloak token`;
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
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-gray-400 font-mono bg-gray-100 inline-block px-1 rounded">
            {{ (item as any).id }}
          </span>
          <span
            :class="[
              'text-xs px-2 py-0.5 rounded-full',
              (item as any).type === 'mobility'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            ]"
          >
            {{ (item as any).type === 'mobility' ? '🌐 Ulb Mobility Twin' : '🏠 Fari Backend' }}
          </span>
        </div>
      </li>
    </template>
  </LibraryBase>
</template>

