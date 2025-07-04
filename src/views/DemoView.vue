<template>
  <div class="demo-gallery">
    <div class="header">
      <h1>Demo Examples Gallery</h1>
      <p class="subtitle">Explore different combinations of 3D tilesets and map layers</p>
    </div>
    
    <div class="examples-grid">
      <div v-for="example in examples" :key="example.id" class="example-card">
        <div class="example-preview">
          <div class="preview-placeholder">
            <div class="preview-icon">🌍</div>
          </div>
        </div>
        <div class="example-info">
          <h3>{{ example.name }}</h3>
          <p class="example-description">{{ example.description }}</p>
          <div class="layer-tags">
            <span v-for="layer in example.layers.filter(l => l.enabled)" :key="layer.id" 
                  class="layer-tag" :class="layer.type">
              {{ layer.name }}
            </span>
          </div>
        </div>
        <div class="example-actions">
          <button @click="openExample(example)" class="view-button">
            View Example
          </button>
        </div>
      </div>
    </div>

    <ExampleViewer v-if="selectedExample" :example="selectedExample" @close="selectedExample = null" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as Cesium from 'cesium';
import ExampleViewer from '../components/ExampleViewer.vue';

const selectedExample = ref(null);

const examples = ref([
  {
    id: 'complete-city',
    name: 'Complete Smart City',
    description: 'A comprehensive view of the smart city including buildings, urban infrastructure, and environmental assets. Features all available 3D tilesets with interactive building information.',
    layers: [
      {
        id: 'basemap',
        name: 'Base Map Layer',
        type: 'basemap',
        enabled: true,
      },
      {
        id: 'buildings',
        name: 'Building Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-18_20-47-13/tileset.json',
        enabled: true,
        style: new Cesium.Cesium3DTileStyle({
          color: {
            conditions: [
              ["${TYPE} === 'ROOFSURFACE'", "color('red')"],
              ["true", "color('white')"],
            ],
          },
        }),
      },
      {
        id: 'trees',
        name: 'Tree Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-20_09-32-51/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'evchargers',
        name: 'EV Charger Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-19_14-19-30/tiles/tileset.json',
        enabled: true,
      },
      {
        id: 'lampposts',
        name: 'Lamppost Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-20_09-25-48/tiles/tileset.json',
        enabled: true,
      },
    ],
  },
  {
    id: 'urban-heat-analysis',
    name: 'Urban Heat Island Analysis',
    description: 'Visualize urban heat islands overlaid on buildings and vegetation. This example combines 3D city assets with environmental data to analyze heat distribution patterns.',
    layers: [
      {
        id: 'basemap',
        name: 'Base Map Layer',
        type: 'basemap',
        enabled: true,
      },
      {
        id: 'buildings',
        name: 'Building Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-18_20-47-13/tileset.json',
        enabled: true,
      },
      {
        id: 'trees',
        name: 'Tree Tileset',
        type: 'tileset',
        url: 'https://digitaltwin.s3.gra.io.cloud.ovh.net/tileset_manager/2025-06-20_09-32-51/tiles/tileset.json',
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

const openExample = (example) => {
  selectedExample.value = example;
};
</script>

<style scoped>
.demo-gallery {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #42b983;
  margin: 0 0 10px 0;
  font-size: 2.5em;
}

.subtitle {
  color: #666;
  font-size: 1.1em;
  margin: 0;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.example-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.example-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.example-preview {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-placeholder {
  text-align: center;
}

.preview-icon {
  font-size: 4em;
  opacity: 0.8;
}

.example-info {
  padding: 20px;
}

.example-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.4em;
}

.example-description {
  color: #666;
  line-height: 1.5;
  margin: 0 0 15px 0;
  font-size: 0.95em;
}

.layer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.layer-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  color: white;
}

.layer-tag.basemap {
  background-color: #6c757d;
}

.layer-tag.tileset {
  background-color: #42b983;
}

.layer-tag.wms {
  background-color: #ff6b6b;
}

.example-actions {
  padding: 0 20px 20px 20px;
}

.view-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #42b983 0%, #369f77 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-button:hover {
  background: linear-gradient(135deg, #369f77 0%, #2d7f63 100%);
  transform: translateY(-2px);
}

.view-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }
  
  .header h1 {
    font-size: 2em;
  }
  
  .demo-gallery {
    padding: 15px;
  }
}
</style> 