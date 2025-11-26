<script setup>
import LibraryBase from '@/components/LibraryBase.vue';
import RealtimeViewer from '@/components/RealtimeViewer.vue';

// Liste des datasets disponibles
const realtimeDatasets = [
  {
    id: 'stib-vehicles',
    name: 'STIB Vehicle Positions',
    description: 'Live positions of STIB vehicles (Metro, Tram, Bus)',
    endpoint: '/stib/vehicle-position',
    type: 'vehicle-positions'
  },
  {
    id: 'sncb-trains',
    name: 'SNCB Train Positions',
    description: 'Live positions of SNCB trains in Belgium',
    endpoint: '/sncb/vehicle-position',
    type: 'vehicle-positions'
  }
];

const getDeckGlSnippet = (dataset) => `
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'maplibre-gl';

// Initialize MapLibre
const map = new Map({
  container: 'map-container',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [4.3517, 50.8503],
  zoom: 12
});

// Fetch vehicle data
const response = await fetch('${import.meta.env.VITE_BACKEND_URL}${dataset.endpoint}');
const data = await response.json();
const vehicles = Array.isArray(data) ? data : data.features || [];

// Create Deck.gl overlay
const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: {
    longitude: 4.3517,
    latitude: 50.8503,
    zoom: 12
  },
  controller: true,
  layers: [
    new ScatterplotLayer({
      id: 'vehicles',
      data: vehicles.map(v => ({
        position: v.geometry.coordinates,
        color: [255, 50, 50]
      })),
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: 10
    })
  ]
});
`.trim();

const getReactSnippet = (dataset) => `
import { useEffect, useState } from 'react';
import { Map } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';

function VehicleMap() {
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicles = async () => {
    const response = await fetch('${import.meta.env.VITE_BACKEND_URL}${dataset.endpoint}');
    const data = await response.json();
    const vehicleData = Array.isArray(data) ? data : data.features || [];
    setVehicles(vehicleData.map(v => ({
      position: v.geometry.coordinates,
      color: [255, 50, 50]
    })));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const layers = [
    new ScatterplotLayer({
      id: 'vehicles',
      data: vehicles,
      getPosition: d => d.position,
      getFillColor: d => d.color,
      getRadius: 10
    })
  ];

  return (
    <DeckGL
      initialViewState={{
        longitude: 4.3517,
        latitude: 50.8503,
        zoom: 12
      }}
      controller={true}
      layers={layers}
    >
      <Map mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" />
    </DeckGL>
  );
}
`.trim();

const codeSnippets = {
  js: getDeckGlSnippet,
  react: getReactSnippet,
};
</script>

<template>
  <LibraryBase
    title="Realtime Data Library"
    itemType="dataset"
    :viewerComponent="RealtimeViewer"
    :codeSnippets="codeSnippets"
    :staticItems="realtimeDatasets"
  >
    <template #list-item="{ items, selectedItem, selectItem }">
      <li
        v-for="dataset in items"
        :key="dataset.id"
        class="flex justify-between items-center px-4 py-2 border-b cursor-pointer hover:bg-gray-100"
        :class="{ 'bg-blue-50': selectedItem && selectedItem.id === dataset.id }"
        @click="selectItem(dataset)"
      >
        <div>
          <div class="font-bold">{{ dataset.name }}</div>
          <div class="text-sm text-gray-600">{{ dataset.description }}</div>
        </div>
      </li>
    </template>
  </LibraryBase>
</template>
