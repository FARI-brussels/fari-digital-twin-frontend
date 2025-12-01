<script setup lang="ts">
import { ref } from 'vue';
import ExampleViewer from '@/components/ExampleViewer.vue';
import type { DemoExample, ExampleLayer } from '@/types';

// ============================================================================
// State
// ============================================================================

const selectedExample = ref<DemoExample | null>(null);

const examples = ref<DemoExample[]>([
  {
    id: 'complete-city',
    name: 'Complete Smart City',
    description:
      'A comprehensive view of the smart city including buildings, urban infrastructure, and environmental assets. Features all available 3D tilesets with interactive building information.',
    layers: [
      {
        id: 'basemap',
        name: 'Base Map Layer',
        type: 'basemap',
        enabled: true,
        url: '',
      },
      {
        id: 'buildings',
        name: 'Building Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-30-52/tileset.json',
        enabled: true,
      },
      {
        id: 'trees',
        name: 'Tree Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-24-12/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'chirec',
        name: 'Chirec hospital',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-20-46/tileset.json',
        enabled: true,
      },
      {
        id: 'josephine',
        name: 'Josephine Charlotte station',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-20-16/tileset.json',
        enabled: true,
      },
      {
        id: 'lampposts',
        name: 'Lamppost Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-42-25/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'usquare',
        name: 'Usquare',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-15-03/tileset.json',
        enabled: true,
      },
    ],
  },
  {
    id: 'urban-heat-analysis',
    name: 'Urban Heat Island Analysis',
    description:
      'Visualize urban heat islands overlaid on buildings and vegetation. This example combines 3D city assets with environmental data to analyze heat distribution patterns.',
    layers: [
      {
        id: 'basemap',
        name: 'Base Map Layer',
        type: 'basemap',
        enabled: true,
        url: '',
      },
      {
        id: 'buildings',
        name: 'Building Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-30-52/tileset.json',
        enabled: true,
      },
      {
        id: 'trees',
        name: 'Tree Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-24-12/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'trees_jette',
        name: 'Tree Tileset Jette',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-08-18_12-27-59/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'heat-islands',
        name: 'Urban Heat Islands',
        type: 'wms',
        url: 'https://ows.environnement.brussels/air',
        layer: 'urban_heat_islands',
        enabled: true,
      },
    ],
  },
]);

// ============================================================================
// Methods
// ============================================================================

function openExample(example: DemoExample): void {
  selectedExample.value = example;
}

function closeExample(): void {
  selectedExample.value = null;
}

function getLayerClasses(layer: ExampleLayer): string {
  const baseClasses = 'px-2 py-1 rounded text-xs font-semibold text-white';
  switch (layer.type) {
    case 'basemap':
      return `${baseClasses} bg-gray-600`;
    case 'tileset':
      return `${baseClasses} bg-green-600`;
    default:
      return `${baseClasses} bg-red-500`;
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-5">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-bold text-green-600 mb-2">Demo Examples Gallery</h1>
      <p class="text-gray-500 text-lg">
        Explore different combinations of 3D tilesets and map layers
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
      <div
        v-for="example in examples"
        :key="example.id"
        class="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
      >
        <div
          class="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <div class="text-5xl opacity-80">🌍</div>
        </div>
        <div class="p-5">
          <h3 class="text-xl font-bold mb-2">{{ example.name }}</h3>
          <p class="text-gray-600 mb-3">{{ example.description }}</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="layer in example.layers.filter((l) => l.enabled)"
              :key="layer.id"
              :class="getLayerClasses(layer)"
            >
              {{ layer.name }}
            </span>
          </div>
          <button
            class="w-full py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition"
            @click="openExample(example)"
          >
            View Example
          </button>
        </div>
      </div>
    </div>
    <ExampleViewer v-if="selectedExample" :example="selectedExample" @close="closeExample" />
  </div>
</template>
